export interface DentistProfile {
  _id?: string;
  _ownerId?: string;
  fullName: string;
  university?: string;
  workplace?: string;
  specialization?: string;
  imageUrl?: string;
  details?: string;
  phone?: string;
  personalHealthNumber?: string;
  _createdOn?: number;
  _updatedOn?: number;
}
