-- 行政區資料
CREATE TABLE IF NOT EXISTS area (
  year          SMALLINT     NOT NULL,
  province_code VARCHAR(2)   NOT NULL,
  city_code     VARCHAR(3)   NOT NULL,
  town_code     VARCHAR(3)   NOT NULL,
  village_code  VARCHAR(4)   NOT NULL,
  name          VARCHAR(300) NOT NULL,

  PRIMARY KEY (year, province_code, city_code, town_code, village_code)
);

COPY area
FROM '/docker-entrypoint-initdb.d/data/area.csv'
DELIMITER ','
CSV HEADER;


-- 選舉概況資料
CREATE TABLE IF NOT EXISTS area_vote (
  year            SMALLINT      NOT NULL,
  province_code   VARCHAR(2)    NOT NULL,
  city_code       VARCHAR(3)    NOT NULL,
  town_code       VARCHAR(3)    NOT NULL,
  village_code    VARCHAR(4)    NOT NULL,
  valid_votes     INT           NOT NULL,
  invalid_votes   INT           NOT NULL,
  total_votes     INT           NOT NULL,
  voter_turnout   NUMERIC(5, 2) NOT NULL,

  PRIMARY KEY (year, province_code, city_code, town_code, village_code),
  FOREIGN KEY (year, province_code, city_code, town_code, village_code)
    REFERENCES area(year, province_code, city_code, town_code, village_code)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

COPY area_vote
FROM '/docker-entrypoint-initdb.d/data/area_vote.csv'
DELIMITER ','
CSV HEADER;


-- 政黨資料
CREATE TABLE IF NOT EXISTS party (
  code SMALLINT    PRIMARY KEY,
  name VARCHAR(40) NOT NULL
);

COPY party
FROM '/docker-entrypoint-initdb.d/data/party.csv'
DELIMITER ','
CSV HEADER;


-- 候選人資料
CREATE TABLE IF NOT EXISTS candidate (
  year       SMALLINT    NOT NULL,
  no         SMALLINT    NOT NULL,
  name       VARCHAR(80) NOT NULL,
  party_code SMALLINT    NOT NULL,

  PRIMARY KEY (year, no),
  FOREIGN KEY (party_code)
    REFERENCES party(code)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

COPY candidate
FROM '/docker-entrypoint-initdb.d/data/candidate.csv'
DELIMITER ','
CSV HEADER;


-- 候選人得票資料
CREATE TABLE IF NOT EXISTS candidate_vote (
  year          SMALLINT      NOT NULL,
  province_code VARCHAR(2)    NOT NULL,
  city_code     VARCHAR(3)    NOT NULL,
  town_code     VARCHAR(3)    NOT NULL,
  village_code  VARCHAR(4)    NOT NULL,
  candidate_no  SMALLINT      NOT NULL,
  total_votes   INT           NOT NULL,
  voter_turnout NUMERIC(5, 2) NOT NULL,
  is_elected    BOOLEAN       NOT NULL,

  PRIMARY KEY (year, province_code, city_code, town_code, village_code, candidate_no),
  FOREIGN KEY (year, province_code, city_code, town_code, village_code)
    REFERENCES area(year, province_code, city_code, town_code, village_code)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  FOREIGN KEY (year, candidate_no)
    REFERENCES candidate(year, no)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

COPY candidate_vote
FROM '/docker-entrypoint-initdb.d/data/candidate_vote.csv'
DELIMITER ','
CSV HEADER;
