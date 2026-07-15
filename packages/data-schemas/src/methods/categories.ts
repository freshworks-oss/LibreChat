import logger from '~/config/winston';

const options = [
  { label: 'com_ui_dbaas', value: 'dbaas' },
] as const;

export type CategoryOption = { label: string; value: string };

export function createCategoriesMethods(_mongoose: typeof import('mongoose')): {
  getCategories: () => Promise<CategoryOption[]>;
} {
  /**
   * Retrieves the categories.
   */
  async function getCategories(): Promise<CategoryOption[]> {
    try {
      return [...options];
    } catch (error) {
      logger.error('Error getting categories', error);
      return [];
    }
  }

  return { getCategories };
}

export type CategoriesMethods = ReturnType<typeof createCategoriesMethods>;
