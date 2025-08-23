import { analyzeDocument } from './analyze-document';
import { detectForgery } from './detect-forgery';

async function runTests() {
  const documentDataUri = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ3aGl0ZSIvPgogIDx0ZXh0IHg9IjEwIiB5PSIyMCIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIxNiI+Q0FTSCBSRUNFSVBUPC90ZXh0PgogIDx0ZXh0IHg9IjEwIiB5PSI1MCIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIxMiI+RGF0ZTogMjAyNS0wOC0xMjwvdGV4dD4KICA8dGV4dCB4PSIxMCIgeT0iNzAiIGZvbnQtZmFtaWx5PSJtb25vc3BhY2UiIGZvbnQtc2l6ZT0iMTIiPkl0ZW0gICAgICAgICAgIFByaWNlPC90ZXh0PgogIDx0ZXh0IHg9IjEwIiB5PSI5MCIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIxMiI+LS0tLS0tLS0tLS0tLS0tLS0tLS08L3RleHQ+CiAgPHRleHQgeD0iMTAiIHk9IjExMCIgZm9udC1mYW1pbHk9Im1vbm9zcGFjZSIgZm9udC1zaXplPSIxMiI+MXggV2lkZ2V0ICAgICAgJDEwLjAwPC90ZXh0PgogIDx0ZXh0IHg9IjEwIiB5PSIxMzAiIGZvbnQtZmFtaWx5PSJtb25vc3BhY2UiIGZvbnQtc2l6ZT0iMTIiPjJ4IEdhZGdldCAgICAgICQyNS4wMDwvdGV4dD4KICA8dGV4dCB4PSIxMCIgeT0iMTUwIiBmb250LWZhbWlseT0ibW9ub3NwYWNlIiBmb250LXNpemU9IjEyIj4tLS0tLS0tLS0tLS0tLS0tLS0tLTwvdGV4dD4KICA8dGV4dCB4PSIxMCIgeT0iMTcwIiBmb250LWZhbWlseT0ibW9ub3NwYWNlIiBmb250LXNpemU9IjEyIj5Ub3RhbDogICAgICAgICAkMzUuMDA8L3RleHQ+Cjwvc3ZnPgo=';

  console.log('--- Running Document Analysis Test ---');
  try {
    const analysisResult = await analyzeDocument({ documentDataUri });
    console.log('Analysis Result:', JSON.stringify(analysisResult, null, 2));
  } catch (error) {
    console.error('Analysis Test Failed:', error);
  }

  console.log('\n--- Running Forgery Detection Test ---');
  try {
    const forgeryResult = await detectForgery({ documentDataUri });
    console.log('Forgery Result:', JSON.stringify(forgeryResult, null, 2));
  } catch (error) {
    console.error('Forgery Test Failed:', error);
  }
}

runTests();
