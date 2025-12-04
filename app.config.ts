export default defineAppConfig({
  ui: {
    select: {
      variants: {
        size: {
          md: {
            trailingIcon: 'text-semantic-primary',
            placeholder: 'text-gray-600',
            content:
              'border-semantic-primary h-full max-h-[70dvh] w-[calc(100dvw-32px)] rounded-lg bg-white sm:w-[calc(50dvw-40px)] md:w-[185px]',
            group: 'px-0 py-2',
            item: 'bg-semantic-hover cursor-pointer px-4 py-2 text-base',
          },
        },
        variant: {
          soft: 'bg-semantic-primary hover:bg-semantic-primary focus:bg-semantic-primary cursor-pointer rounded-full py-1.5 pl-3 sm:py-2 sm:text-base',
        },
      },
      compoundVariants: [
        {
          color: 'neutral',
          variant: ['soft'],
          class: 'focus-visible:ring-2 focus-visible:ring-inset',
        },
      ],
      defaultVariants: {
        size: 'md',
        color: 'neutral',
        variant: 'soft',
      },
    },
    button: {
      compoundVariants: [
        {
          color: 'neutral',
          variant: 'soft',
          class:
            'bg-semantic-primary text-semantic-primary focus-visible:bg-semantic-primary cursor-pointer justify-center rounded-full text-base font-bold transition-colors hover:bg-gray-300 focus-visible:ring-2 focus-visible:ring-inset active:bg-gray-400',
        },
      ],
      defaultVariants: {
        size: 'md',
        color: 'neutral',
        variant: 'soft',
      },
    },
  },
});
