export function shuffle<T>(array: T[]) {
  let currentIndex = array.length,
    randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
}

export function removeRepeat<T>(array: T[]) {
  const newArray: T[] = [];

  for (const item of array) {
    if (!newArray.includes(item)) {
      newArray.push(item);
    }
  }

  return newArray;
}
