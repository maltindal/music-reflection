const segah = [
  'kaba rast',
  'kaba kürdî',
  'kaba segah',
  'kaba çargah',
  'yegah',
  'hüseynî aşiran',
  'acem aşiran',
  'ırak',
  'rast',
  'dügah',
  'kürdî',
  'segah',
  'çargah',
  'nevâ',
  'hüseynî',
  'acem',
  'evç',
  'gerdaniye',
  'muhayyer',
  'tiz segah',
  'tiz çargah',
  'tiz nevâ',
  'tiz hüseynî',
];

const hicaz = [
  'kaba rast',
  'kaba dügah',
  'kaba dik kürdî',
  'kaba nim hicaz',
  'yegah',
  'hüseynî aşiran',
  'ırak',
  'rast',
  'dügah',
  'dik kürdî',
  'nim hicaz',
  'nevâ',
  'hüseynî',
  'evç',
  'gerdaniye',
  'muhayyer',
  'sünbüle',
  'tiz nim hicaz',
  'tiz nevâ',
  'tiz hüseynî',
];

function makamFilter(notes, makam) {
  return _.filter(notes, x => _.find(makam, mn => x.n === mn) !== undefined);
}

export {
  segah,
  hicaz,
  makamFilter,
};
