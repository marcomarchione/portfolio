/**
 * TechnologyFilter Component
 *
 * Clickable technology pills for filtering projects.
 * Updates URL and triggers callback without page reload.
 */
import { useCallback } from 'react';

export interface Technology {
  id: number;
  name: string;
  slug: string;
  color: string | null;
}

export interface TechnologyFilterProps {
  technologies: Technology[];
  selectedTechnology: string;
  onFilterChange: (technology: string) => void;
  allLabel: string;
}

export function TechnologyFilter({
  technologies,
  selectedTechnology,
  onFilterChange,
  allLabel,
}: TechnologyFilterProps) {
  const handleClick = useCallback((tech: string) => {
    onFilterChange(tech);
  }, [onFilterChange]);

  return (
    <div className="flex flex-wrap gap-2">
      {/* "All" pill */}
      <button
        type="button"
        onClick={() => handleClick('')}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
          selectedTechnology === ''
            ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25 [.light_&]:!bg-terra-500 [.light_&]:!shadow-terra-500/25'
            : 'bg-neutral-800/50 text-neutral-300 hover:bg-neutral-700/50 hover:text-white [.light_&]:bg-neutral-200 [.light_&]:text-neutral-700 [.light_&]:hover:bg-cream-300'
        }`}
      >
        {allLabel}
      </button>

      {/* Technology pills */}
      {technologies.map((tech) => (
        <button
          key={tech.id}
          type="button"
          onClick={() => handleClick(tech.name)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
            selectedTechnology === tech.name
              ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25 [.light_&]:!bg-terra-500 [.light_&]:!shadow-terra-500/25'
              : 'bg-neutral-800/50 text-neutral-300 hover:bg-neutral-700/50 hover:text-white [.light_&]:bg-neutral-200 [.light_&]:text-neutral-700 [.light_&]:hover:bg-cream-300'
          }`}
        >
          {tech.name}
        </button>
      ))}
    </div>
  );
}

export default TechnologyFilter;
