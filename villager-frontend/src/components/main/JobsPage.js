import './TabPages.css';

function JobsPage() {
  return (
    <section className="tab-page" aria-labelledby="tab-jobs-title">
      <h2 id="tab-jobs-title" className="tab-page__title">
        알바
      </h2>
      <p className="tab-page__desc">동네 알바·도움 구하기를 찾아보세요.</p>
      <div className="tab-page__card">알바 목록은 곧 이곳에 표시됩니다.</div>
    </section>
  );
}

export default JobsPage;
