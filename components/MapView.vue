<template>
  <div
    ref="mapWrapper"
    class="relative h-full w-full cursor-grab bg-[#E4FAFF] active:cursor-grabbing"
  >
    <div
      v-show="areaStore.isProvinceLevel"
      ref="islandWrapper"
      class="absolute top-3 left-3 flex flex-col gap-2"
    />

    <div v-show="!areaStore.isProvinceLevel" class="fixed m-6">
      <UButton class="bg-white p-1 pr-3" @click="handleResetMapClick">
        <span class="bg-semantic-primary mr-2 flex rounded-full p-2">
          <Icon name="mdi:arrow-left" />
        </span>
        返回
      </UButton>
    </div>

    <div
      ref="tooltip"
      role="tooltip"
      class="pointer-events-none fixed bg-white px-3 py-2 text-sm font-bold opacity-0 select-none"
    />
  </div>
</template>

<script lang="ts" setup>
import { AREA_DEFAULT_CODE } from '@/constants/areas';
import { PARTY_COLOR_MAP } from '@/constants/colors';
import type { TAreaLevel } from '@/types/area';
import type { D3ZoomEvent, GeoPath, Selection } from 'd3';
import { geoCentroid, geoMercator, geoPath, select, zoom, zoomIdentity } from 'd3';
import type { Feature, FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import * as topojson from 'topojson-client';
import type { GeometryObject, Topology } from 'topojson-specification';

const areaStore = useAreaStore();
const uiStore = useUiStore();

const MAP_BASE_WIDTH = 500;
const MAP_BASE_SCALE = 12600;
const AREA_DEFAULT_COLOR = '#CCCCCC';
const ZOOM_DURATION = 750;
const baseFontSize = computed(() => Math.max(14, Math.min(14, Math.round(currentScale / 900))));

// DOM 元素
const mapWrapperEl = useTemplateRef<HTMLDivElement>('mapWrapper');
const islandWrapperEl = useTemplateRef<HTMLDivElement>('islandWrapper');
const tooltipEl = useTemplateRef<HTMLDivElement>('tooltip');
const { width: mapWrapperWidth, height: mapWrapperHeight } = useElementSize(mapWrapperEl);

// 地圖數據
let mapTopology: Topology | null = null;
let cityCollection: FeatureCollection | null = null;
let townCollection: FeatureCollection | null = null;

// D3 物件
let mapSelection: Selection<SVGSVGElement, unknown, null, undefined> | null = null;
let citySelection: Selection<SVGPathElement, Feature, SVGSVGElement, unknown> | null = null;
let townSelection: Selection<SVGPathElement, Feature, SVGSVGElement, unknown> | null = null;
let pathGenerator: GeoPath | null = null;
let zoomBehavior: ReturnType<typeof zoom<SVGSVGElement, unknown>> | null = null;
let currentScale: number = 0;
let limitedTransform = '';
let scaledFontSize = '';

onMounted(async () => {
  await loadMapData();
  renderMap();
});

watch(
  () => [mapWrapperWidth.value, mapWrapperHeight.value],
  () => renderMap(),
);

watch(
  () => areaStore.currentAreaCode,
  (newCode) => handleAreaCodeChange(newCode),
  { deep: true },
);

watch(
  () => areaStore.cities,
  () => updateCityColors(),
);

watch(
  () => areaStore.towns,
  () => {
    updateTownNames();
    updateTownColors();
  },
);

const loadMapData = async () => {
  try {
    const data = await $fetch('/map_1140318.json');
    mapTopology = toRaw(data) as Topology;
    const { city, town } = mapTopology.objects;

    if (!city || !town) throw new Error();

    cityCollection = topojson.feature(mapTopology, city) as FeatureCollection;
    townCollection = topojson.feature(mapTopology, town) as FeatureCollection;
  } catch {
    uiStore.showToastMessage({ type: 'error', text: '地圖資料載入失敗' });
  }
};

const renderMap = () => {
  if (!cityCollection || !townCollection) return;

  select(mapWrapperEl.value).selectAll('svg').remove();
  createMapSelection();
  setupMapZoom();
  buildCityLayer();
  buildIslandLayer();
  updateCityColors();
  bindCityEvents();
};

const createMapSelection = () => {
  const baseHeight = 845;
  const baseTranslateX = 270;
  const baseTranslateY = 330;

  const widthRatio = mapWrapperWidth.value / MAP_BASE_WIDTH;
  const heightRatio = mapWrapperHeight.value / baseHeight;

  currentScale = MAP_BASE_SCALE * Math.min(widthRatio, heightRatio);
  const translateX = baseTranslateX * widthRatio;
  const translateY = baseTranslateY * heightRatio;

  // 坐標轉換: [經度, 緯度] -> [x, y]
  const mercator = geoMercator()
    .center([121, 24])
    .scale(currentScale)
    .translate([translateX, translateY]);

  pathGenerator = geoPath().projection(mercator);

  mapSelection = select(mapWrapperEl.value)
    .append('svg')
    .attr('viewBox', `0 0 ${mapWrapperWidth.value} ${mapWrapperHeight.value}`);
};

const setupMapZoom = () => {
  zoomBehavior = zoom<SVGSVGElement, unknown>().scaleExtent([1, 8]).on('zoom', handleZoomEvent);
  mapSelection?.call(zoomBehavior).on('dblclick.zoom', null); // 移除雙擊事件，避免與拖曳衝突
};

const handleZoomEvent = (event: D3ZoomEvent<SVGSVGElement, unknown>) => {
  if (!pathGenerator || !cityCollection || !mapSelection) return;

  const geoBounds = pathGenerator.bounds(cityCollection);
  const [[geoOriginalLeft, geoOriginalTop], [geoOriginalRight, geoOriginalBottom]] = geoBounds;

  const [geoLeft, geoTop] = event.transform.apply([geoOriginalLeft, geoOriginalTop]);
  const [geoRight, geoBottom] = event.transform.apply([geoOriginalRight, geoOriginalBottom]);

  let newX = event.transform.x;
  let newY = event.transform.y;
  const padding = event.transform.k * 80;

  // 左、上邊不能大於 padding
  if (geoLeft > padding) newX -= geoLeft - padding;
  if (geoTop > padding) newY -= geoTop - padding;

  // 右、下邊不能小於 容器寬 - padding
  if (geoRight < mapWrapperWidth.value - padding)
    newX += mapWrapperWidth.value - padding - geoRight;
  if (geoBottom < mapWrapperHeight.value - padding)
    newY += mapWrapperHeight.value - padding - geoBottom;

  limitedTransform = zoomIdentity.translate(newX, newY).scale(event.transform.k).toString();
  scaledFontSize = `${baseFontSize.value / event.transform.k}px`;

  mapSelection.selectAll('path, text').attr('transform', limitedTransform);
  mapSelection.selectAll('text').attr('font-size', scaledFontSize);
};

const buildCityLayer = () => {
  if (!mapSelection || !cityCollection || !pathGenerator || !mapTopology) return;

  // 繪製區域
  citySelection = mapSelection
    .selectAll('.city')
    .data(cityCollection.features)
    .enter()
    .append('path')
    .attr('class', 'city')
    .attr('data-province-code', (data) => getProvinceCode(data))
    .attr('data-city-code', (data) => getCityCode(data))
    .attr('data-name', (data) => getCityName(data))
    .attr('d', pathGenerator);

  // 繪製交界線
  const geometryObject = mapTopology.objects.city as GeometryObject;
  const boundary = topojson.mesh(mapTopology, geometryObject, (a, b) => a !== b);
  mapSelection.datum(boundary).append('path').attr('class', 'city-border').attr('d', pathGenerator);

  // 繪製 hover 遮罩
  mapSelection
    .selectAll('.city-overlay')
    .data(cityCollection.features)
    .enter()
    .append('path')
    .attr('class', 'city-overlay')
    .attr('data-name', (data) => getCityName(data))
    .attr('d', pathGenerator);

  // 繪製名稱
  const hiddenAreas = ['嘉義市', '新竹市'];
  const labelData = cityCollection.features.map((feature) => {
    const name = getCityName(feature);
    if (!feature.properties || !name) return;
    feature.properties.displayName = hiddenAreas.includes(name) ? '' : name.replace(/縣|市/g, '');
    return feature;
  }) as Feature<Geometry, GeoJsonProperties>[];

  mapSelection
    .selectAll('.city-label')
    .data(labelData.filter((d) => d.properties?.displayName))
    .enter()
    .append('text')
    .attr('class', 'city-label')
    .attr('font-size', () => `${baseFontSize.value}px`)
    .text((d) => d.properties?.displayName)
    .attr('x', (d) => (pathGenerator ? pathGenerator.centroid(d)[0] : 0))
    .attr('y', (d) => (pathGenerator ? pathGenerator.centroid(d)[1] : 0));
};

const buildIslandLayer = () => {
  if (!cityCollection || !islandWrapperEl.value) return;

  const ISLAND_NAMES = ['連江', '金門', '澎湖'];
  const ISLAND_CONFIG = {
    連江: {
      ratio: 1,
      scale: 1.5,
      offsetX: -8,
      offsetY: -1,
    },
    金門: {
      ratio: 1,
      scale: 0.8,
      offsetX: -3,
      offsetY: -4,
    },
    澎湖: {
      ratio: 138 / 72,
      scale: 1.2,
      offsetX: 0.5,
      offsetY: 0.5,
    },
  };

  const islandFeatures = cityCollection.features.filter((feature) =>
    ISLAND_NAMES.some((name) => getCityName(feature)?.includes(name)),
  );

  islandFeatures.forEach((feature) => {
    const name = getCityName(feature)?.replace(/縣|市/g, '') as keyof typeof ISLAND_CONFIG;
    const config = ISLAND_CONFIG[name];

    const svgMaxWidth = 72;
    const svgMinWidth = 68;

    const svgWidth = Math.max(svgMinWidth, (mapWrapperWidth.value / MAP_BASE_WIDTH) * svgMaxWidth);
    const svgHeight = svgWidth * config.ratio;

    // 繪製底圖
    const islandSvg = select(islandWrapperEl.value)
      .append('svg')
      .attr('class', 'island')
      .attr('width', svgWidth)
      .attr('height', svgHeight)
      .on('click', async () => {
        const provinceCode = getProvinceCode(feature);
        const cityCode = getCityCode(feature);
        if (provinceCode && cityCode) {
          await areaStore.updateCity({ provinceCode, cityCode });
          zoomToCity(feature);
        }
      });

    // 繪製區域
    const centroid = geoCentroid(feature);
    const centerX = centroid[0] + config.offsetX * 0.01;
    const centerY = centroid[1] + config.offsetY * 0.01;

    const mercator = geoMercator()
      .center([centerX, centerY])
      .scale(MAP_BASE_SCALE * config.scale)
      .translate([svgWidth / 2, svgHeight / 2]);

    const islandPathGenerator = geoPath().projection(mercator);

    islandSvg
      .datum(feature)
      .append('path')
      .attr('class', 'city')
      .attr('data-province-code', getProvinceCode(feature))
      .attr('data-city-code', getCityCode(feature))
      .attr('d', islandPathGenerator);

    // 繪製名稱
    islandSvg
      .append('text')
      .attr('class', 'city-label')
      .attr('font-size', `${baseFontSize.value}px`)
      .attr('alignment-baseline', 'bottom')
      .text(getCityName(feature)?.replace(/縣|市/g, '') ?? '')
      .attr('x', svgWidth / 2)
      .attr('y', svgHeight - baseFontSize.value);
  });
};

const buildTownLayer = (townData: Feature[]) => {
  if (!mapSelection || !pathGenerator) return;

  // 繪製區域
  townSelection = mapSelection
    .selectAll('.town')
    .data(townData)
    .enter()
    .append('path')
    .attr('class', 'town')
    .attr('data-province-code', (data) => getProvinceCode(data))
    .attr('data-city-code', (data) => getCityCode(data))
    .attr('data-town-code', (data) => getTownCode(data))
    .attr('d', pathGenerator);

  // 繪製 hover 遮罩
  mapSelection
    .selectAll('.town-overlay')
    .data(townData)
    .enter()
    .append('path')
    .attr('class', 'town-overlay')
    .attr('data-province-code', (data) => getProvinceCode(data))
    .attr('data-city-code', (data) => getCityCode(data))
    .attr('data-town-code', (data) => getTownCode(data))
    .attr('d', pathGenerator);
};

const bindCityEvents = () => {
  if (!citySelection) return;

  citySelection
    .on('mouseenter', function (_, data) {
      const name = getCityName(data);
      mapSelection?.selectAll(`.city-overlay[data-name="${name}"]`).classed('active', true);
    })
    .on('mouseleave', function (_, data) {
      const name = getCityName(data);
      mapSelection?.selectAll(`.city-overlay[data-name="${name}"]`).classed('active', false);
    })
    .on('click', async function (_, data) {
      const { provinceCode, cityCode } = this.dataset;
      if (provinceCode && cityCode) {
        await areaStore.updateCity({ provinceCode, cityCode });
        zoomToCity(data);
      }
    });
};

const bindTownEvents = () => {
  if (!townSelection) return;

  townSelection
    .on('mousemove', function (event) {
      if (!tooltipEl.value) return;
      tooltipEl.value.textContent = this.dataset.name || '';
      tooltipEl.value.style.top = `${event.pageY - window.scrollY + 18}px`;
      tooltipEl.value.style.left = `${event.pageX + 16}px`;
      tooltipEl.value.style.opacity = '100';
    })
    .on('mouseenter', (_, data) => {
      const name = getTownName(data);
      mapSelection?.selectAll(`.town-overlay[data-name="${name}"]`).classed('active', true);
    })
    .on('mouseleave', (_, data) => {
      const name = getTownName(data);
      if (name !== areaStore.currentAreaData?.area.name) {
        mapSelection?.selectAll(`.town-overlay[data-name="${name}"]`).classed('active', false);
      }
      if (tooltipEl.value) {
        tooltipEl.value.style.opacity = '0';
      }
    })
    .on('click', async (_, data) => {
      const townCode = getTownCode(data);
      if (townCode) {
        await areaStore.updateTown(townCode);
        handleTownClick(data);
      }
    });
};

const zoomToCity = async function (feature: Feature) {
  if (!mapSelection || !townCollection || !pathGenerator) return;

  mapSelection.selectAll('.town, .town-label, .town-overlay').remove();
  mapSelection.selectAll('.city-border, .city-label').style('display', 'none');

  const geoBounds = pathGenerator.bounds(feature);
  const cityWidth = geoBounds[1][0] - geoBounds[0][0];
  const cityHeight = geoBounds[1][1] - geoBounds[0][1];

  const widthRatio = mapWrapperWidth.value / cityWidth;
  const heightRatio = mapWrapperHeight.value / cityHeight;
  const scale = Math.max(2.5, Math.min(widthRatio, heightRatio, 8)) * 0.85;

  const currentCityName = getCityName(feature);
  const townFeatures = townCollection.features.filter(
    (feature) => getCityName(feature) === currentCityName,
  );

  const specialRegions = ['連江縣', '澎湖縣', '臺中市', '屏東縣', '臺東縣']; // 需要完整顯示的地區
  const [centerX, centerY] = specialRegions.includes(currentCityName ?? '')
    ? [(geoBounds[0][0] + geoBounds[1][0]) / 2, (geoBounds[0][1] + geoBounds[1][1]) / 2]
    : pathGenerator.centroid(feature);

  const transform = zoomIdentity
    .translate(mapWrapperWidth.value / 2, mapWrapperHeight.value / 2)
    .scale(scale)
    .translate(-centerX, -centerY);

  if (zoomBehavior && townFeatures) {
    mapSelection.transition().duration(ZOOM_DURATION).call(zoomBehavior.transform, transform);
    buildTownLayer(townFeatures);
    updateTownNames();
    updateTownColors();
    bindTownEvents();
  }
};

const zoomToCityByCode = async (provinceCode: string, cityCode: string) => {
  const features = cityCollection?.features.find(
    (feature) => getProvinceCode(feature) === provinceCode && getCityCode(feature) === cityCode,
  );
  if (features) zoomToCity(features);
};

const selectTownByCode = (provinceCode: string, cityCode: string, townCode: string) => {
  const feature = townCollection?.features.find(
    (feature) =>
      getProvinceCode(feature) === provinceCode &&
      getCityCode(feature) === cityCode &&
      getTownCode(feature) === townCode,
  );
  if (feature) handleTownClick(feature);
};

const handleAreaCodeChange = (newCode: Record<TAreaLevel, string>) => {
  const { province, city, town } = newCode;

  if (areaStore.isProvinceLevel) {
    resetToNationalView();
    return;
  }

  if (areaStore.isCityLevel) {
    zoomToCityByCode(province, city);
    return;
  }

  if (areaStore.isTownLevel) {
    selectTownByCode(province, city, town);
    return;
  }
};

const handleTownClick = (data: Feature) => {
  if (!mapSelection || !pathGenerator) return;

  mapSelection.selectAll('.town-label').remove();
  mapSelection.selectAll('.town-overlay').classed('active', false);

  const [x, y] = pathGenerator.centroid(data);

  const provinceCode = getProvinceCode(data);
  const cityCode = getCityCode(data);
  const townCode = getTownCode(data);

  const name =
    areaStore.towns.find(
      (town) =>
        town.provinceCode === provinceCode &&
        town.cityCode === cityCode &&
        town.townCode === townCode,
    )?.name ?? '';

  mapSelection
    .append('text')
    .attr('class', 'town-label')
    .attr('font-size', scaledFontSize)
    .text(name)
    .attr('x', x)
    .attr('y', y)
    .attr('transform', limitedTransform);

  mapSelection.selectAll(`.town-overlay[data-name="${name}"]`).classed('active', true);
};

const handleResetMapClick = async () => {
  const { province: provinceCode, city: cityCode } = AREA_DEFAULT_CODE;
  await areaStore.updateCity({ provinceCode, cityCode });
  resetToNationalView();
};

const resetToNationalView = () => {
  if (zoomBehavior) {
    mapSelection?.transition().duration(ZOOM_DURATION).call(zoomBehavior.transform, zoomIdentity);
    mapSelection?.selectAll('.town, .town-label, .town-overlay').remove();
    mapSelection?.selectAll('.city-border, .city-label').style('display', 'block');
  }
};

const updateCityColors = () => {
  select(mapWrapperEl.value)
    .selectAll<SVGPathElement, unknown>('path.city')
    .each(function () {
      const { provinceCode, cityCode } = this.dataset;
      if (provinceCode && cityCode) {
        select(this).attr('fill', getWinnerColor(provinceCode, cityCode));
      }
    });
};

const updateTownColors = () => {
  mapSelection?.selectAll<SVGPathElement, unknown>('path.town').each(function () {
    const { provinceCode, cityCode, townCode } = this.dataset;
    if (provinceCode && cityCode && townCode) {
      select(this).attr('fill', getWinnerColor(provinceCode, cityCode, townCode));
    }
  });
};

const updateTownNames = () => {
  mapSelection?.selectAll('.town, .town-overlay').attr('data-name', function () {
    const { provinceCode, cityCode, townCode } = (this as HTMLElement).dataset;
    const data = areaStore.towns.find(
      (town) =>
        town.provinceCode === provinceCode &&
        town.cityCode === cityCode &&
        town.townCode === townCode,
    );
    return data?.name ?? '';
  });
};

const getProvinceCode = (feature: Feature): string | null => {
  return feature.properties?.COUNTYCODE.slice(0, 2) ?? null;
};

const getCityCode = (feature: Feature): string | null => {
  return feature.properties?.COUNTYCODE.slice(2, 5) ?? null;
};

const getTownCode = (feature: Feature): string | null => {
  return feature.properties?.TOWNCODE.slice(5, 8) ?? null;
};

const getCityName = (feature: Feature): string | null => {
  return feature.properties?.COUNTYNAME ?? null;
};

const getTownName = (feature: Feature): string | null => {
  return feature.properties?.TOWNNAME ?? null;
};

const getWinnerColor = (provinceCode: string, cityCode: string, townCode?: string): string => {
  const areaList = townCode ? areaStore.towns : areaStore.cities;

  const data = areaList.find(
    (area) =>
      area.provinceCode === provinceCode &&
      area.cityCode === cityCode &&
      (townCode ? area.townCode === townCode : true),
  );

  const winner = data?.candidates.find((candidate) => candidate.isElected);
  const color = winner
    ? (PARTY_COLOR_MAP[winner.partyName] ?? AREA_DEFAULT_COLOR)
    : AREA_DEFAULT_COLOR;

  return color;
};
</script>

<style scoped>
@reference "tailwindcss";

:deep(.city),
:deep(.town) {
  cursor: pointer;
}

:deep(.city-label),
:deep(.town-label) {
  fill: #ffffff;
  font-weight: 700;
  text-shadow:
    -1px -1px #334155,
    1px 1px #334155,
    1px -1px #334155,
    -1px 1px #334155;
  text-anchor: middle;
  alignment-baseline: central;
  pointer-events: none;
  user-select: none;
}

:deep(.city-overlay),
:deep(.town-overlay) {
  fill: #ffffff;
  fill-opacity: 0;
  transition: fill-opacity 0.3s;
  pointer-events: none;
}

:deep(.city-overlay.active),
:deep(.town-overlay.active) {
  fill-opacity: 0.2;
}

:deep(.city-border) {
  fill: none;
  stroke: #ffffff;
  stroke-width: 1.1;
  pointer-events: none;
}

:deep(.island) {
  cursor: pointer;
  border-radius: 8px;
  @apply bg-white transition-colors hover:bg-gray-50;
}

:deep(.town) {
  stroke: #ffffff;
  stroke-width: 2.1;
  vector-effect: non-scaling-stroke;
}
</style>
