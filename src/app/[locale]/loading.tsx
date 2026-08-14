export default function LocaleLoading() {
  return (
    <div className="container">
      <div className="loading-grid">
        {Array.from({ length: 8 }, (_, index) => (
          <div className="skeleton" key={index} />
        ))}
      </div>
    </div>
  );
}
