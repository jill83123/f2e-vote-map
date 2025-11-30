export default defineAppConfig({
  ui: {
    select: {
      slots: {
        base: 'semantic-bg-primary cursor-pointer rounded-full py-1.5 pl-3! ring-0! sm:py-2 sm:text-base',
        content:
          'semantic-border-primary! h-full max-h-[70dvh]! w-[calc(100dvw-32px)] rounded-lg bg-white sm:w-[calc(50dvw-40px)] md:w-[185px]',
        item: 'semantic-bg-hover cursor-pointer px-4! py-2! text-base!',
        group: 'px-0 py-2',
        trailingIcon: 'semantic-text-primary!',
        placeholder: 'text-gray-600',
      },
    },
    button: {
      slots: {
        base: 'semantic-bg-primary semantic-text-primary! cursor-pointer justify-center rounded-full text-base! transition-colors hover:bg-gray-300',
      },
    },
  },
});
