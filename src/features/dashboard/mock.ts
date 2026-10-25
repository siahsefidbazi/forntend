export type TransportMode = 'metro' | 'bus' | 'walk' | 'car';
export type LegStatus = 'upcoming' | 'active' | 'completed';
export type VerificationStatus = 'verified' | 'pending' | 'missing';

export type TehranPoint = {
  id: string;
  name: string;
  district: string;
  x: number;
  y: number;
};

export type CommuteLeg = {
  id: string;
  title: string;
  from: string;
  to: string;
  time: string;
  mode: TransportMode;
  status: LegStatus;
};

export type MatchOffer = {
  id: string;
  pickupCoordinate: { latitude: number; longitude: number };
  dropoffCoordinate: { latitude: number; longitude: number };
  pickupStop: string;
  dropoffStop: string;
  sender: string;
  parcel: string;
  weight: string;
  extraMinutes: number;
  extraWalkMeters: number;
  routeFit: number;
  priceToman: number;
  expectedDeliveryAt: string;
  expiresInMinutes: number;
  pickupCode: string;
  deliveryCode: string;
};

export type SenderOrder = {
  id: string;
  from: string;
  to: string;
  parcel: string;
  timeWindow: string;
  priceToman: number;
  status: string;
};

export type DashboardData = {
  userName: string;
  unreadNotifications: number;
  weekEarningsToman: number;
  weekDeliveries: number;
  verificationStatus: VerificationStatus;
  searchRadiusKm: number;
  maxDetourMinutes: number;
  maxWalkMeters: number;
  pilotArea: string;
  tehranPoints: TehranPoint[];
  todayLegs: CommuteLeg[];
  offers: MatchOffer[];
  senderOrders: SenderOrder[];
};

export const MOCK_DASHBOARD: DashboardData = {
  userName: 'همراه مسیر',
  unreadNotifications: 3,
  weekEarningsToman: 185000,
  weekDeliveries: 4,
  verificationStatus: 'verified',
  searchRadiusKm: 5,
  maxDetourMinutes: 12,
  maxWalkMeters: 900,
  pilotArea: 'کریدور انقلاب، ولیعصر، هفت تیر و بهشتی',
  tehranPoints: [
    { id: 'tajrish', name: 'تجریش', district: 'شمال تهران', x: 50, y: 13 },
    { id: 'vanak', name: 'ونک', district: 'منطقه ۳', x: 56, y: 28 },
    { id: 'shariati', name: 'دکتر شریعتی', district: 'منطقه ۷', x: 62, y: 43 },
    { id: 'haft-tir', name: 'هفت تیر', district: 'مرکز تهران', x: 55, y: 49 },
    { id: 'valiasr', name: 'میدان ولیعصر', district: 'مرکز تهران', x: 46, y: 55 },
    { id: 'enghelab', name: 'میدان انقلاب', district: 'منطقه ۶', x: 35, y: 60 },
    { id: 'azadi', name: 'آزادی', district: 'غرب تهران', x: 17, y: 66 },
    { id: 'beheshti', name: 'شهید بهشتی', district: 'منطقه ۷', x: 52, y: 39 },
    { id: 'bazaar', name: 'بازار تهران', district: 'منطقه ۱۲', x: 49, y: 78 },
  ],
  todayLegs: [
    {
      id: 'leg-morning',
      title: 'رفت به محل کار',
      from: 'مترو شهید بهشتی',
      to: 'میدان ولیعصر',
      time: '08:15',
      mode: 'metro',
      status: 'active',
    },
    {
      id: 'leg-evening',
      title: 'برگشت به خانه',
      from: 'میدان ولیعصر',
      to: 'مترو شهید بهشتی',
      time: '17:30',
      mode: 'metro',
      status: 'upcoming',
    },
  ],
  offers: [
    {
      id: 'match-123',
      pickupCoordinate: { latitude: 35.7012, longitude: 51.3912 },
      dropoffCoordinate: { latitude: 35.7115, longitude: 51.407 },
      pickupStop: 'میدان انقلاب',
      dropoffStop: 'میدان ولیعصر',
      sender: 'فروشگاه کتاب آبان',
      parcel: 'بسته کوچک اسناد',
      weight: 'زیر ۱ کیلو',
      extraMinutes: 9,
      extraWalkMeters: 750,
      routeFit: 92,
      priceToman: 42000,
      expectedDeliveryAt: '08:42',
      expiresInMinutes: 12,
      pickupCode: '48219',
      deliveryCode: '73104',
    },
    {
      id: 'match-124',
      pickupCoordinate: { latitude: 35.7355, longitude: 51.4455 },
      dropoffCoordinate: { latitude: 35.7158, longitude: 51.4254 },
      pickupStop: 'دکتر شریعتی',
      dropoffStop: 'هفت تیر',
      sender: 'داروخانه مرکزی',
      parcel: 'پاکت سبک',
      weight: 'زیر ۵۰۰ گرم',
      extraMinutes: 5,
      extraWalkMeters: 400,
      routeFit: 86,
      priceToman: 31000,
      expectedDeliveryAt: '09:05',
      expiresInMinutes: 25,
      pickupCode: '19026',
      deliveryCode: '61588',
    },
    {
      id: 'match-125',
      pickupCoordinate: { latitude: 35.7575, longitude: 51.4099 },
      dropoffCoordinate: { latitude: 35.7314, longitude: 51.4355 },
      pickupStop: 'ونک',
      dropoffStop: 'شهید بهشتی',
      sender: 'شرکت حسابداری آرمان',
      parcel: 'پوشه قرارداد',
      weight: 'زیر ۲ کیلو',
      extraMinutes: 11,
      extraWalkMeters: 680,
      routeFit: 81,
      priceToman: 52000,
      expectedDeliveryAt: '10:15',
      expiresInMinutes: 18,
      pickupCode: '77420',
      deliveryCode: '30591',
    },
  ],
  senderOrders: [
    {
      id: 'order-73',
      from: 'خیابان انقلاب، کتاب‌فروشی آبان',
      to: 'میدان ولیعصر، پلاک ۱۲',
      parcel: 'کتاب و رسید',
      timeWindow: 'امروز تا ۱۰:۳۰',
      priceToman: 42000,
      status: 'در انتظار پذیرش حمل‌کننده',
    },
    {
      id: 'order-74',
      from: 'هفت تیر، خیابان کریم‌خان',
      to: 'بهشتی، نزدیک مترو',
      parcel: 'پاکت اداری',
      timeWindow: 'امروز تا ۱۸:۳۰',
      priceToman: 36000,
      status: 'پیشنهاد فعال',
    },
  ],
};
