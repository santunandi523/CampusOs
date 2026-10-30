function StatCard({ label, value }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow border border-sky-100">
      <p className="text-gray-400 text-sm">{label}</p>
      <h3 className="text-2xl font-black text-slate-800 mt-2">
        {value}
      </h3>
    </div>
  );
}

export default StatCard;
