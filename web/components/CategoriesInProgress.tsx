export function CategoriesInProgress({ categories }: { categories: string[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4" data-testid="categories-in-progress">
      {categories.map((category) => (
        <div key={category} className="rounded-lg border border-dashed border-ocean/20 p-4">
          <p className="font-display text-base text-ocean">{category}</p>
          <p className="mt-1 text-xs text-ocean-muted">Data not yet available</p>
        </div>
      ))}
    </div>
  );
}
