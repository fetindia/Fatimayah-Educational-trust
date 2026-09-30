/**
 * @license
 * Indian States & Union Territories with Districts Dataset
 * Fatimyah Educational Trust India (FET India)
 * 
 * Provides full jurisdictional coverage for India-wide District, State/UT,
 * and National administrative delegations.
 */

export interface StateLocationInfo {
  state: string;
  isUT?: boolean;
  districts: string[];
}

export const INDIAN_STATES_AND_UTS: StateLocationInfo[] = [
  {
    state: 'Jammu & Kashmir',
    isUT: true,
    districts: [
      'Jammu',
      'Kathua',
      'Srinagar',
      'Anantnag',
      'Baramulla',
      'Budgam',
      'Pulwama',
      'Kupwara',
      'Shopian',
      'Ganderbal',
      'Kulgam',
      'Bandipora',
      'Udhampur',
      'Reasi',
      'Rajouri',
      'Poonch',
      'Doda',
      'Ramban',
      'Kishtwar',
      'Samba'
    ]
  },
  {
    state: 'Ladakh',
    isUT: true,
    districts: ['Leh', 'Kargil']
  },
  {
    state: 'Delhi',
    isUT: true,
    districts: [
      'Central Delhi',
      'East Delhi',
      'New Delhi',
      'North Delhi',
      'North East Delhi',
      'North West Delhi',
      'Shahdara',
      'South Delhi',
      'South East Delhi',
      'South West Delhi',
      'West Delhi'
    ]
  },
  {
    state: 'Punjab',
    districts: [
      'Amritsar',
      'Barnala',
      'Bathinda',
      'Faridkot',
      'Fatehgarh Sahib',
      'Fazilka',
      'Ferozepur',
      'Gurdaspur',
      'Hoshiarpur',
      'Jalandhar',
      'Kapurthala',
      'Ludhiana',
      'Mansa',
      'Moga',
      'Muktsar',
      'Pathankot',
      'Patiala',
      'Rupnagar',
      'Sahibzada Ajit Singh Nagar (Mohali)',
      'Sangrur',
      'Shahid Bhagat Singh Nagar',
      'Tarn Taran'
    ]
  },
  {
    state: 'Maharashtra',
    districts: [
      'Mumbai City',
      'Mumbai Suburban',
      'Thane',
      'Palghar',
      'Raigad',
      'Pune',
      'Nagpur',
      'Nashik',
      'Aurangabad (Chhatrapati Sambhaji Nagar)',
      'Solapur',
      'Amravati',
      'Kolhapur',
      'Sangli',
      'Satara',
      'Ahmednagar',
      'Jalgaon',
      'Nanded',
      'Akola',
      'Latur',
      'Dhule'
    ]
  },
  {
    state: 'Uttar Pradesh',
    districts: [
      'Lucknow',
      'Kanpur Nagar',
      'Varanasi',
      'Prayagraj (Allahabad)',
      'Agra',
      'Aligarh',
      'Meerut',
      'Bareilly',
      'Moradabad',
      'Ghaziabad',
      'Gautam Buddha Nagar (Noida)',
      'Gorakhpur',
      'Saharanpur',
      'Ayodhya',
      'Jhansi',
      'Muzaffarnagar',
      'Mathura',
      'Budaun',
      'Rampur',
      'Bijnor'
    ]
  },
  {
    state: 'Bihar',
    districts: [
      'Patna',
      'Gaya',
      'Bhagalpur',
      'Muzaffarpur',
      'Purnia',
      'Darbhanga',
      'Bihar Sharif',
      'Arrah',
      'Begusarai',
      'Katihar',
      'Munger',
      'Chhapra',
      'Danapur',
      'Bettiah',
      'Saharsa',
      'Sasaram',
      'Hajipur',
      'Dehri',
      'Siwan',
      'Motihari'
    ]
  },
  {
    state: 'Karnataka',
    districts: [
      'Bengaluru Urban',
      'Bengaluru Rural',
      'Mysuru',
      'Belagavi',
      'Kalaburagi',
      'Dharwad (Hubballi)',
      'Dakshina Kannada (Mangaluru)',
      'Vijayapura',
      'Shivamogga',
      'Ballari',
      'Tumakuru',
      'Udupi',
      'Davangere',
      'Bidar',
      'Raichur'
    ]
  },
  {
    state: 'Telangana',
    districts: [
      'Hyderabad',
      'Ranga Reddy',
      'Medchal-Malkajgiri',
      'Warangal',
      'Nizamabad',
      'Karimnagar',
      'Khammam',
      'Nalgonda',
      'Mahabubnagar',
      'Sangareddy'
    ]
  },
  {
    state: 'Andhra Pradesh',
    districts: [
      'Visakhapatnam',
      'Vijayawada (NTR)',
      'Guntur',
      'Nellore',
      'Kurnool',
      'Kakinada',
      'Tirupati',
      'Kadapa',
      'Anantapur',
      'Chittoor'
    ]
  },
  {
    state: 'West Bengal',
    districts: [
      'Kolkata',
      'North 24 Parganas',
      'South 24 Parganas',
      'Howrah',
      'Hooghly',
      'Murshidabad',
      'Purba Medinipur',
      'Paschim Medinipur',
      'Burdwan (Purba & Paschim)',
      'Malda',
      'Siliguri (Darjeeling)',
      'Nadia'
    ]
  },
  {
    state: 'Tamil Nadu',
    districts: [
      'Chennai',
      'Coimbatore',
      'Madurai',
      'Tiruchirappalli',
      'Salem',
      'Tirunelveli',
      'Tiruppur',
      'Vellore',
      'Erode',
      'Thoothukudi'
    ]
  },
  {
    state: 'Gujarat',
    districts: [
      'Ahmedabad',
      'Surat',
      'Vadodara',
      'Rajkot',
      'Bhavnagar',
      'Jamnagar',
      'Junagadh',
      'Gandhinagar',
      'Anand',
      'Kutch'
    ]
  },
  {
    state: 'Rajasthan',
    districts: [
      'Jaipur',
      'Jodhpur',
      'Kota',
      'Bikaner',
      'Ajmer',
      'Udaipur',
      'Bhilwara',
      'Alwar',
      'Bharatpur',
      'Sikar'
    ]
  },
  {
    state: 'Madhya Pradesh',
    districts: [
      'Bhopal',
      'Indore',
      'Jabalpur',
      'Gwalior',
      'Ujjain',
      'Sagar',
      'Dewas',
      'Satna',
      'Ratlam',
      'Rewa'
    ]
  },
  {
    state: 'Kerala',
    districts: [
      'Thiruvananthapuram',
      'Ernakulam (Kochi)',
      'Kozhikode',
      'Malappuram',
      'Thrissur',
      'Kollam',
      'Palakkad',
      'Alappuzha',
      'Kannur',
      'Kottayam'
    ]
  },
  {
    state: 'Haryana',
    districts: [
      'Gurugram',
      'Faridabad',
      'Panipat',
      'Ambala',
      'Yamunanagar',
      'Rohtak',
      'Hisar',
      'Karnal',
      'Sonipat',
      'Panchkula'
    ]
  },
  {
    state: 'Himachal Pradesh',
    districts: ['Shimla', 'Kangra', 'Mandi', 'Solan', 'Kullu', 'Sirmaur', 'Hamirpur', 'Una', 'Bilaspur', 'Chamba']
  },
  {
    state: 'Uttarakhand',
    districts: ['Dehradun', 'Haridwar', 'Nainital', 'Udham Singh Nagar', 'Almora', 'Pauri Garhwal', 'Tehri Garhwal', 'Chamoli']
  },
  {
    state: 'Assam',
    districts: ['Kamrup Metropolitan (Guwahati)', 'Kamrup', 'Cachar (Silchar)', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia']
  },
  {
    state: 'Jharkhand',
    districts: ['Ranchi', 'East Singhbhum (Jamshedpur)', 'Dhanbad', 'Bokaro', 'Hazaribagh', 'Deoghar']
  },
  {
    state: 'Odisha',
    districts: ['Khordha (Bhubaneswar)', 'Cuttack', 'Sundargarh (Rourkela)', 'Ganjam (Berhampur)', 'Puri', 'Sambalpur', 'Balasore']
  },
  {
    state: 'Chhattisgarh',
    districts: ['Raipur', 'Durg (Bhilai)', 'Bilaspur', 'Korba', 'Rajnandgaon', 'Jagdalpur']
  },
  {
    state: 'Goa',
    districts: ['North Goa', 'South Goa']
  },
  {
    state: 'Chandigarh',
    isUT: true,
    districts: ['Chandigarh']
  },
  {
    state: 'Tripura',
    districts: ['West Tripura (Agartala)', 'Gomati', 'South Tripura', 'North Tripura']
  },
  {
    state: 'Manipur',
    districts: ['Imphal West', 'Imphal East', 'Thoubal', 'Bishnupur', 'Churachandpur']
  },
  {
    state: 'Meghalaya',
    districts: ['East Khasi Hills (Shillong)', 'West Garo Hills (Tura)', 'Ri-Bhoi']
  },
  {
    state: 'Mizoram',
    districts: ['Aizawl', 'Lunglei', 'Champhai']
  },
  {
    state: 'Nagaland',
    districts: ['Dimapur', 'Kohima', 'Mokokchung']
  },
  {
    state: 'Arunachal Pradesh',
    districts: ['Papum Pare (Itanagar)', 'Changlang', 'West Kameng']
  },
  {
    state: 'Sikkim',
    districts: ['East Sikkim (Gangtok)', 'West Sikkim', 'South Sikkim', 'North Sikkim']
  },
  {
    state: 'Puducherry',
    isUT: true,
    districts: ['Puducherry', 'Karaikal', 'Mahe', 'Yanam']
  },
  {
    state: 'Andaman & Nicobar Islands',
    isUT: true,
    districts: ['South Andaman (Port Blair)', 'North & Middle Andaman', 'Nicobar']
  },
  {
    state: 'Dadra and Nagar Haveli and Daman and Diu',
    isUT: true,
    districts: ['Daman', 'Diu', 'Dadra & Nagar Haveli']
  },
  {
    state: 'Lakshadweep',
    isUT: true,
    districts: ['Kavaratti', 'Agatti', 'Amini']
  }
];

export const ALL_INDIAN_STATES: string[] = INDIAN_STATES_AND_UTS.map(s => s.state);

export function getDistrictsForState(stateName: string): string[] {
  if (!stateName) return [];
  const found = INDIAN_STATES_AND_UTS.find(s => s.state.toLowerCase() === stateName.toLowerCase().trim());
  return found ? found.districts : [];
}
