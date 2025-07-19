export interface Purchase {
  _id?: string;
  _ownerId?: string;        // patient user
  promotionId: string;
  dentistId: string;
  createdOn: number;
}
