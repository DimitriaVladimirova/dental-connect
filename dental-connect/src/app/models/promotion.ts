export interface Promotion {
  _id?: string;
  _ownerId?: string;
  dentistId: string;
  service: string;
  price: number;
  description?: string;
  _createdOn?: number;
  _updatedOn?: number;
}
