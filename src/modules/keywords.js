// TODO: meketing DB 연동 후 실제 키워드 조회 로직으로 교체
const PROFIT_KEYWORDS = ['맛집', '추천', '가격', '후기'];

export const pickTopProfitableKeywords = (keywords = [], limit = 10) => {
  if (!Array.isArray(keywords)) return [];

  return keywords
    .filter((item) => {
      const token = typeof item === 'string' ? item : item?.keyword || '';
      return PROFIT_KEYWORDS.some((kw) => token.includes(kw));
    })
    .slice(0, limit)
    .map((item) => ({
      keyword: typeof item === 'string' ? item : item.keyword,
      score: typeof item === 'string' ? 0 : item.score || 0
    }));
};
