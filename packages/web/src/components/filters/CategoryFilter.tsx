/**
 * CategoryFilter Component
 *
 * Clickable category pills for filtering materials.
 * Updates URL and triggers callback without page reload.
 */
import { useCallback } from 'react';

/**
 * Material categories as defined in the schema
 */
export const MATERIAL_CATEGORIES = ['guide', 'template', 'resource', 'tool'] as const;

export type MaterialCategory = (typeof MATERIAL_CATEGORIES)[number];

export interface CategoryLabels {
  guide: string;
  template: string;
  resource: string;
  tool: string;
}

export interface CategoryFilterProps {
  selectedCategory: string;
  onFilterChange: (category: string) => void;
  allLabel: string;
  categoryLabels: CategoryLabels;
}

export function CategoryFilter({
  selectedCategory,
  onFilterChange,
  allLabel,
  categoryLabels,
}: CategoryFilterProps) {
  const handleClick = useCallback(
    (category: string) => {
      onFilterChange(category);
    },
    [onFilterChange]
  );

  return (
    <div className="flex flex-wrap gap-2">
      {/* "All" pill */}
      <button
        type="button"
        onClick={() => handleClick('')}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
          selectedCategory === ''
            ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25 [.light_&]:!bg-terra-500 [.light_&]:!shadow-terra-500/25'
            : 'bg-neutral-800/50 text-neutral-300 hover:bg-neutral-700/50 hover:text-white [.light_&]:bg-neutral-200 [.light_&]:text-neutral-700 [.light_&]:hover:bg-cream-300'
        }`}
      >
        {allLabel}
      </button>

      {/* Category pills */}
      {MATERIAL_CATEGORIES.map((category) => (
        <button
          key={category}
          type="button"
          onClick={() => handleClick(category)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
            selectedCategory === category
              ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25 [.light_&]:!bg-terra-500 [.light_&]:!shadow-terra-500/25'
              : 'bg-neutral-800/50 text-neutral-300 hover:bg-neutral-700/50 hover:text-white [.light_&]:bg-neutral-200 [.light_&]:text-neutral-700 [.light_&]:hover:bg-cream-300'
          }`}
        >
          {categoryLabels[category]}
        </button>
      ))}
    </div>
  );
}

export default CategoryFilter;
