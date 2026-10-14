// Bangladesh Administrative & Land Records Geo Hierarchy

const BANGLADESH_DIVISIONS = [
  'ঢাকা',
  'চট্টগ্রাম',
  'রাজশাহী',
  'খুলনা',
  'বরিশাল',
  'সিলেট',
  'রংপুর',
  'ময়মনসিংহ'
];

const RAJSHAHI_DISTRICTS = [
  'বগুড়া',
  'রাজশাহী',
  'জয়পুরহাট',
  'নওগাঁ',
  'নাটোর',
  'পাবনা',
  'সিরাজগঞ্জ',
  'চাঁপাইনবাবগঞ্জ'
];

const BOGURA_UPAZILAS = [
  'শিবগঞ্জ',
  'বগুড়া সদর',
  'শেরপুর',
  'শাজাহানপুর',
  'গাবতলী',
  'কাহালু',
  'দুপচাঁচিয়া',
  'আদমদীঘি',
  'নন্দীগ্রাম',
  'সারিয়াকান্দি',
  'সোনাতলা',
  'ধুনট'
];

// বগুড়া জেলার শিবগঞ্জ উপজেলার প্রথম ২০টি মৌজা (জে.এল ক্রম অনুযায়ী)
const SHIBGANJ_MOUZAS = [
  { jl_no: '1', mouza: 'গুজিয়া' },
  { jl_no: '2', mouza: 'অনন্তবালা' },
  { jl_no: '3', mouza: 'চক অনন্তবালা' },
  { jl_no: '4', mouza: 'কিচক' },
  { jl_no: '5', mouza: 'বেলাই' },
  { jl_no: '6', mouza: 'হরিপুর' },
  { jl_no: '7', mouza: 'চক হরিপুর' },
  { jl_no: '8', mouza: 'বিশা' },
  { jl_no: '9', mouza: 'কানাইডাঙ্গা' },
  { jl_no: '10', mouza: 'সর্দারপাড়া' },
  { jl_no: '11', mouza: 'জানগ্রাম' },
  { jl_no: '12', mouza: 'রামচন্দ্রপুর' },
  { jl_no: '13', mouza: 'ধাওয়া' },
  { jl_no: '14', mouza: 'চক ধাওয়া' },
  { jl_no: '15', mouza: 'চণ্ডীহারা' },
  { jl_no: '16', mouza: 'চক চণ্ডীহারা' },
  { jl_no: '17', mouza: 'করতকোলা' },
  { jl_no: '18', mouza: 'শোলাগাড়ী' },
  { jl_no: '19', mouza: 'বুড়িগঞ্জ' },
  { jl_no: '20', mouza: 'সাদুল্লাপুর' }
];

module.exports = {
  BANGLADESH_DIVISIONS,
  RAJSHAHI_DISTRICTS,
  BOGURA_UPAZILAS,
  SHIBGANJ_MOUZAS
};
