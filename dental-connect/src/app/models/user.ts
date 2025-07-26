export interface User {
  _id: string;
  email: string;
  accessToken: string;
  role?: 'dentist' | 'patient';
}
