export interface DistrictOption {
  name: string;
  isDhaka: boolean;
  areas: string[];
}

export const BANGLADESH_DISTRICTS: DistrictOption[] = [
  {
    name: 'Dhaka',
    isDhaka: true,
    areas: [
      'Dhanmondi', 'Gulshan-1', 'Gulshan-2', 'Banani', 'Uttara', 'Mirpur', 'Mohammadpur',
      'Badda', 'Motijheel', 'Paltan', 'Shahbagh', 'Khilgaon', 'Rampura', 'Malibagh',
      'Bashundhara R/A', 'Baridhara', 'Lalbagh', 'Old Dhaka', 'Wari', 'Jatrabari',
      'Mohakhali', 'Tejgaon', 'Farmgate', 'Elephant Road', 'Panthapath', 'Shyamoli',
      'Kalyanpur', 'Savar', 'Keraniganj', 'Dhamrai'
    ]
  },
  {
    name: 'Gazipur',
    isDhaka: false,
    areas: ['Gazipur Sadar', 'Tongi', 'Chowrasta', 'Board Bazar', 'Kaliakair', 'Kapasia', 'Sreepur']
  },
  {
    name: 'Narayanganj',
    isDhaka: false,
    areas: ['Narayanganj Sadar', 'Fatullah', 'Siddhirganj', 'Bandar', 'Araihazar', 'Sonargaon', 'Rupganj']
  },
  {
    name: 'Chattogram',
    isDhaka: false,
    areas: ['Agrabad', 'GEC Circle', 'Nasirabad', 'Panchlaish', 'Halishahar', 'Chawkbazar', 'Kotwali', 'Khulshi', 'Bakalia', 'Pahartali', 'Patenga', 'Hathazari', 'Sitakunda', 'Raozan']
  },
  {
    name: 'Sylhet',
    isDhaka: false,
    areas: ['Sylhet Sadar', 'Zindabazar', 'Amberkhana', 'Subidbazar', 'Upashahar', 'South Surma', 'Beanibazar', 'Golapganj', 'Sreemangal']
  },
  {
    name: 'Rajshahi',
    isDhaka: false,
    areas: ['Boalia', 'Motihar', 'Rajpara', 'Shah Makhdum', 'Paba', 'Godagari', 'Bagmara']
  },
  {
    name: 'Khulna',
    isDhaka: false,
    areas: ['Khulna Sadar', 'Sonadanga', 'Khalishpur', 'Daulatpur', 'Khan Jahan Ali', 'Rupsha', 'Dumuria']
  },
  {
    name: 'Barishal',
    isDhaka: false,
    areas: ['Kotwali', 'Natullabad', 'Rupatali', 'Amtala', 'Babuganj', 'Bakerganj', 'Banaripara']
  },
  {
    name: 'Rangpur',
    isDhaka: false,
    areas: ['Rangpur Sadar', 'Kotwali', 'Tajhat', 'Mahiganj', 'Pirgachha', 'Mithapukur', 'Badarganj']
  },
  {
    name: 'Mymensingh',
    isDhaka: false,
    areas: ['Kotwali', 'Town Hall', 'Charpara', 'Ganginarpar', 'Trishal', 'Muktagachha', 'Gafargaon', 'Bhaluka']
  },
  {
    name: 'Cumilla',
    isDhaka: false,
    areas: ['Kandirpar', 'Kotwali', 'Paduar Bazar', 'Burichang', 'Chandina', 'Daudkandi', 'Laksam']
  },
  {
    name: 'Bogura',
    isDhaka: false,
    areas: ['Bogura Sadar', 'Satmatha', 'Jaleshwaritola', 'Shajahanpur', 'Sherpur', 'Shibganj', 'Gabtali']
  },
  {
    name: 'Cox\'s Bazar',
    isDhaka: false,
    areas: ['Cox\'s Bazar Sadar', 'Kolatoli', 'Laboni', 'Ramu', 'Chakaria', 'Teknaf', 'Maheshkhali']
  },
  {
    name: 'Noakhali',
    isDhaka: false,
    areas: ['Maijdee', 'Begumganj', 'Chowmuhani', 'Senbagh', 'Chatkhil', 'Companyganj', 'Hatiya']
  },
  {
    name: 'Feni',
    isDhaka: false,
    areas: ['Feni Sadar', 'Trunk Road', 'Daganbhuiyan', 'Chhagalnaiya', 'Parshuram', 'Fulgazi', 'Sonagazi']
  },
  {
    name: 'Brahmanbaria',
    isDhaka: false,
    areas: ['Brahmanbaria Sadar', 'Ashuganj', 'Kasba', 'Nabinagar', 'Sarail', 'Bancharampur', 'Akhaura']
  },
  {
    name: 'Jessore',
    isDhaka: false,
    areas: ['Jessore Sadar', 'Doratana', 'Chowrasta', 'Jhikargachha', 'Manirampur', 'Abhaynagar', 'Keshabpur']
  },
  {
    name: 'Kushtia',
    isDhaka: false,
    areas: ['Kushtia Sadar', 'Majompur', 'Kumarkhali', 'Bheramara', 'Mirpur', 'Khoksa', 'Daulatpur']
  },
  {
    name: 'Tangail',
    isDhaka: false,
    areas: ['Tangail Sadar', 'Mirzapur', 'Kalihati', 'Ghatail', 'Madhupur', 'Sakhipur', 'Basail']
  },
  {
    name: 'Faridpur',
    isDhaka: false,
    areas: ['Faridpur Sadar', 'Goalchamot', 'Bhanga', 'Boalmari', 'Madhukhali', 'Nagarkanda', 'Sadarpur']
  },
  {
    name: 'Pabna',
    isDhaka: false,
    areas: ['Pabna Sadar', 'Ishwardi', 'Sujanagar', 'Santhia', 'Bera', 'Chatmohar', 'Faridpur']
  },
  {
    name: 'Dinajpur',
    isDhaka: false,
    areas: ['Dinajpur Sadar', 'Gorer Math', 'Birganj', 'Fulbari', 'Parbatipur', 'Kaharole', 'Birol']
  },
  {
    name: 'Narsingdi',
    isDhaka: false,
    areas: ['Narsingdi Sadar', 'Madhabdi', 'Palash', 'Shibpur', 'Belabo', 'Raipura', 'Monohardi']
  },
  {
    name: 'Munshiganj',
    isDhaka: false,
    areas: ['Munshiganj Sadar', 'Sreenagar', 'Sirajdikhan', 'Lohajang', 'Tongibari', 'Gazaria']
  },
  {
    name: 'Manikganj',
    isDhaka: false,
    areas: ['Manikganj Sadar', 'Singair', 'Saturia', 'Ghior', 'Shivalaya', 'Harirampur', 'Daulatpur']
  },
  {
    name: 'Kishoreganj',
    isDhaka: false,
    areas: ['Kishoreganj Sadar', 'Bhairab', 'Bajitpur', 'Katiadi', 'Pakundia', 'Karimganj', 'Tarail']
  },
  {
    name: 'Habiganj',
    isDhaka: false,
    areas: ['Habiganj Sadar', 'Madhabpur', 'Nabiganj', 'Bahubal', 'Chunarughat', 'Baniyachong']
  },
  {
    name: 'Moulvibazar',
    isDhaka: false,
    areas: ['Moulvibazar Sadar', 'Sreemangal', 'Kulaura', 'Kamalganj', 'Barlekha', 'Rajnagar']
  },
  {
    name: 'Sunamganj',
    isDhaka: false,
    areas: ['Sunamganj Sadar', 'Chhatak', 'Jagannathpur', 'Derai', 'Tahirpur', 'Dowarabazar']
  },
  {
    name: 'Sirajganj',
    isDhaka: false,
    areas: ['Sirajganj Sadar', 'Belkuchi', 'Shahjadpur', 'Ullapara', 'Kazipur', 'Kamarkhanda']
  },
  {
    name: 'Naogaon',
    isDhaka: false,
    areas: ['Naogaon Sadar', 'Patnitala', 'Manda', 'Mohadevpur', 'Dhamoirhat', 'Badalgachhi']
  },
  {
    name: 'Natore',
    isDhaka: false,
    areas: ['Natore Sadar', 'Baraigram', 'Singra', 'Gurudaspur', 'Lalpur', 'Bagatipara']
  },
  {
    name: 'Chapainawabganj',
    isDhaka: false,
    areas: ['Chapainawabganj Sadar', 'Shibganj', 'Gomostapur', 'Nachole', 'Bholahat']
  },
  {
    name: 'Bagerhat',
    isDhaka: false,
    areas: ['Bagerhat Sadar', 'Mongla', 'Morrelganj', 'Fakirhat', 'Rampal', 'Kachua']
  },
  {
    name: 'Satkhira',
    isDhaka: false,
    areas: ['Satkhira Sadar', 'Kalaroa', 'Tala', 'Debhata', 'Kaliganj', 'Assasuni', 'Shyamnagar']
  },
  {
    name: 'Jhenaidah',
    isDhaka: false,
    areas: ['Jhenaidah Sadar', 'Kaliganj', 'Kotchandpur', 'Maheshpur', 'Shailkupa', 'Harinakunda']
  },
  {
    name: 'Chuadanga',
    isDhaka: false,
    areas: ['Chuadanga Sadar', 'Alamdanga', 'Damurhuda', 'Jibannagar']
  },
  {
    name: 'Magura',
    isDhaka: false,
    areas: ['Magura Sadar', 'Sreepur', 'Shalikha', 'Mohammadpur']
  },
  {
    name: 'Narail',
    isDhaka: false,
    areas: ['Narail Sadar', 'Lohagara', 'Kalia']
  },
  {
    name: 'Meherpur',
    isDhaka: false,
    areas: ['Meherpur Sadar', 'Gangni', 'Mujibnagar']
  },
  {
    name: 'Patuakhali',
    isDhaka: false,
    areas: ['Patuakhali Sadar', 'Kuakata', 'Galachipa', 'Bauphal', 'Kalapara', 'Mirzaganj', 'Dumki']
  },
  {
    name: 'Bhola',
    isDhaka: false,
    areas: ['Bhola Sadar', 'Borhanuddin', 'Lalmohan', 'Char Fasson', 'Daulatkhan', 'Tazumuddin']
  },
  {
    name: 'Pirojpur',
    isDhaka: false,
    areas: ['Pirojpur Sadar', 'Mathbaria', 'Bhandaria', 'Nesarabad (Swarupkati)', 'Nazirpur', 'Kawkhali']
  },
  {
    name: 'Jhalokati',
    isDhaka: false,
    areas: ['Jhalokati Sadar', 'Nalchity', 'Rajapur', 'Kathalia']
  },
  {
    name: 'Barguna',
    isDhaka: false,
    areas: ['Barguna Sadar', 'Amtali', 'Patharghata', 'Betagi', 'Bamna', 'Taltali']
  },
  {
    name: 'Chandpur',
    isDhaka: false,
    areas: ['Chandpur Sadar', 'Hajiganj', 'Shahrasti', 'Faridganj', 'Matlab North', 'Matlab South', 'Kachua']
  },
  {
    name: 'Lakshmipur',
    isDhaka: false,
    areas: ['Lakshmipur Sadar', 'Raipur', 'Ramganj', 'Ramgati', 'Kamalnagar']
  },
  {
    name: 'Jamalpur',
    isDhaka: false,
    areas: ['Jamalpur Sadar', 'Melandaha', 'Islampur', 'Dewanganj', 'Sarishabari', 'Madarganj', 'Bakshiganj']
  },
  {
    name: 'Sherpur',
    isDhaka: false,
    areas: ['Sherpur Sadar', 'Nalitabari', 'Nakla', 'Sreebardi', 'Jhenaigati']
  },
  {
    name: 'Netrokona',
    isDhaka: false,
    areas: ['Netrokona Sadar', 'Kendua', 'Durgapur', 'Mohanganj', 'Barhatta', 'Purbadhala', 'Kalmakanda']
  },
  {
    name: 'Gaibandha',
    isDhaka: false,
    areas: ['Gaibandha Sadar', 'Gobindaganj', 'Palashbari', 'Sundarganj', 'Sadullapur', 'Saghata']
  },
  {
    name: 'Kurigram',
    isDhaka: false,
    areas: ['Kurigram Sadar', 'Nageshwari', 'Bhurungamari', 'Ulipur', 'Chilmari', 'Rajarhat']
  },
  {
    name: 'Lalmonirhat',
    isDhaka: false,
    areas: ['Lalmonirhat Sadar', 'Patgram', 'Hatibandha', 'Kaliganj', 'Aditmari']
  },
  {
    name: 'Nilphamari',
    isDhaka: false,
    areas: ['Nilphamari Sadar', 'Saidpur', 'Domar', 'Dimla', 'Jaldhaka', 'Kishoreganj']
  },
  {
    name: 'Panchagarh',
    isDhaka: false,
    areas: ['Panchagarh Sadar', 'Tetulia', 'Boda', 'Debiganj', 'Atwari']
  },
  {
    name: 'Thakurgaon',
    isDhaka: false,
    areas: ['Thakurgaon Sadar', 'Pirganj', 'Ranisankail', 'Baliadangi', 'Haripur']
  },
  {
    name: 'Joypurhat',
    isDhaka: false,
    areas: ['Joypurhat Sadar', 'Panchbibi', 'Kalai', 'Khetlal', 'Akkelpur']
  },
  {
    name: 'Gopalganj',
    isDhaka: false,
    areas: ['Gopalganj Sadar', 'Kashiani', 'Kotalipara', 'Muksudpur', 'Tungipara']
  },
  {
    name: 'Madaripur',
    isDhaka: false,
    areas: ['Madaripur Sadar', 'Shibchar', 'Kalkini', 'Rajoir']
  },
  {
    name: 'Shariatpur',
    isDhaka: false,
    areas: ['Shariatpur Sadar', 'Naria', 'Zajira', 'Bhedarganj', 'Damudya', 'Gosairhat']
  },
  {
    name: 'Rajbari',
    isDhaka: false,
    areas: ['Rajbari Sadar', 'Pangsha', 'Kalukhali', 'Baliakandi', 'Goalanda']
  },
  {
    name: 'Bandarban',
    isDhaka: false,
    areas: ['Bandarban Sadar', 'Ruma', 'Thanchi', 'Rowangchhari', 'Lama', 'Alikadam', 'Naikhongchhari']
  },
  {
    name: 'Rangamati',
    isDhaka: false,
    areas: ['Rangamati Sadar', 'Kaptai', 'Baghaichhari', 'Barkal', 'Langadu', 'Juraichhari', 'Belaichhari']
  },
  {
    name: 'Khagrachhari',
    isDhaka: false,
    areas: ['Khagrachhari Sadar', 'Dighinala', 'Panchhari', 'Mahalchhari', 'Matiranga', 'Manikchhari', 'Ramgarh']
  }
];
