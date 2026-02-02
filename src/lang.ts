export function looksMostlyEnglish(text: string) {
  // Very rough heuristic: lots of ASCII words and very few Greek characters.
  const greek = (text.match(/[\u0370-\u03FF\u1F00-\u1FFF]/g) || []).length;
  const latin = (text.match(/[A-Za-z]/g) || []).length;
  return latin > 80 && greek < 20;
}
