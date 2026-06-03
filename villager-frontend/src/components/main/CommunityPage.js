import './TabPages.css';

function CommunityPage() {
  return (
    <section className="tab-page" aria-labelledby="tab-community-title">
      <h2 id="tab-community-title" className="tab-page__title">
        커뮤니티
      </h2>
      <p className="tab-page__desc">동네 소식과 이야기를 나눠 보세요.</p>
      <div className="tab-page__card">게시글 피드는 곧 이곳에 표시됩니다.</div>
    </section>
  );
}

export default CommunityPage;
