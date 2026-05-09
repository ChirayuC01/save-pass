const SkeletonRow = () => (
  <tr className="animate-pulse">
    {[1, 2, 3, 4].map((i) => (
      <td key={i} className="py-3 px-4 border border-white dark:border-slate-700">
        <div className="h-4 bg-green-200 dark:bg-slate-600 rounded-full mx-auto w-3/4" />
      </td>
    ))}
  </tr>
);

export const SkeletonTable = ({ rows = 3 }: { rows?: number }) => (
  <div className="overflow-x-auto">
    <table className="table-auto min-w-full overflow-hidden rounded-md">
      <thead className="bg-green-800 text-white">
        <tr>
          {['Site', 'Username', 'Password', 'Actions'].map((h) => (
            <th key={h} className="py-2 px-4 text-sm md:text-base">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-green-50 dark:bg-slate-800">
        {Array.from({ length: rows }).map((_, i) => <SkeletonRow key={i} />)}
      </tbody>
    </table>
  </div>
);
