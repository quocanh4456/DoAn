export interface User {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  roleId: number;
  isActive: boolean;
  createdAt: string;
}

export interface Role {
  id: number;
  name: string;
}

export interface Route {
  id: number;
  origin: string;
  destination: string;
  distance: number;
  basePrice: number;
  isActive: boolean;
}

export interface Schedule {
  id: number;
  routeId: number;
  departureTime: string;
  isActive: boolean;
  route?: Route;
}

export interface Bus {
  id: number;
  licensePlate: string;
  busType: string;
  totalSeats: number;
  isActive: boolean;
}

export interface Trip {
  id: number;
  scheduleId: number;
  busId: number;
  driverName: string;
  departureDate: string;
  availableSeats: number;
  status: string;
  schedule: Schedule;
  bus: Bus;
}

export interface Ticket {
  id: number;
  tripId: number;
  userId: number;
  seatCount: number;
  pickUpLocation: string;
  dropOffLocation: string;
  totalPrice: number;
  status: string;
  createdAt: string;
  trip?: Trip;
  user?: User;
  expiresIn?: number;
}

export interface Payment {
  id: number;
  ticketId: number;
  amount: number;
  transactionId: string;
  paymentMethod: string;
  status: string;
  paidAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    fullName: string;
    email: string;
    role: string;
  };
}

export interface RevenueData {
  date: string;
  total: number;
  count: number;
}

export interface TripStat {
  tripId: number;
  departureDate: string;
  route: string;
  departureTime: string;
  busType: string;
  totalSeats: number;
  ticketCount: number;
  passengerCount: number;
}
