// TODO: GPT-4o/Ollama 연동 및 anythingelse 톤 프롬프트 적용
export const generateDraft = async ({ topic, keywords = [] }) => {
  return {
    title: `${topic} 추천 팁 정리`,
    body: `[임시 템플릿]\n주제: ${topic}\n핵심 키워드: ${keywords.join(', ')}`,
    seo: {
      keywords,
      metaDescription: `${topic}에 대한 실전 리뷰와 선택 가이드를 정리했습니다.`
    }
  };
};
