export interface User {
  _id: string;
  email: string;
  accessToken: string;
  // Optional: role (frontend-only, we infer)
  role?: 'dentist' | 'patient';
}
