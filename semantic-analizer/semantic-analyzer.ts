import { FeatureExtractionPipeline, pipeline } from '@xenova/transformers';

export class SemanticAnalyzer {
  
  private extractor: FeatureExtractionPipeline | null = null;
  
  private async getExtractor(): Promise<FeatureExtractionPipeline> {
    if (!this.extractor) {
      // eslint-disable-next-line no-console
      console.log('[SemanticAnalyzer] Initializing embedding pipeline (Xenova/all-MiniLM-L6-v2)');
      this.extractor = (await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2',
      )) as FeatureExtractionPipeline;
      // eslint-disable-next-line no-console
      console.log('[SemanticAnalyzer] Embedding pipeline ready');
    }
    return this.extractor;
  }

  private static cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0;
    let na = 0;
    let nb = 0;
    for (let i = 0; i < a.length; i += 1) {
      dot += a[i] * b[i];
      na += a[i] * a[i];
      nb += b[i] * b[i];
    }
    return dot / (Math.sqrt(na) * Math.sqrt(nb));
  }

  async embed(text: string): Promise<number[]> {
    const startedAt = Date.now();
    const extractor = await this.getExtractor();
    const out = await extractor(text, { pooling: 'mean', normalize: true });
    const vec = Array.from(out.data as Float32Array);
    const elapsed = Date.now() - startedAt;
    const preview = text.length > 80 ? `${text.slice(0, 80)}...` : text;
    // eslint-disable-next-line no-console
    console.log(
      `[SemanticAnalyzer] embed: len=${text.length} dims=${vec.length} elapsedMs=${elapsed} preview="${preview}"`,
    );
    return vec;
  }

  async semanticSimilarity(expected: string, actual: string): Promise<number> {
    const startedAt = Date.now();
    const [e1, e2] = await Promise.all([this.embed(expected), this.embed(actual)]);
    const sim = SemanticAnalyzer.cosineSimilarity(e1, e2);
    const elapsed = Date.now() - startedAt;
    // eslint-disable-next-line no-console
    console.log(`[SemanticAnalyzer] similarity: sim=${sim.toFixed(3)} elapsedMs=${elapsed}`);
    return sim;
  }
}


