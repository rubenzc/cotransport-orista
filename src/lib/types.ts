export type TripKind = 'oferta' | 'peticion';
export type Schedule = 'puntual' | 'recurrente';
export type CommitmentStatus = 'pendiente' | 'confirmado' | 'rechazado' | 'cancelado';
export type ProposalStatus = 'pendiente' | 'aceptada' | 'rechazada' | 'retirada';

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
}

export interface Vehicle {
  id: string;
  owner_id: string;
  model: string;
  color: string | null;
  seats: number;
  notes: string | null;
}

export interface Commitment {
  id: string;
  trip_id: string;
  user_id: string;
  role: 'pasajero' | 'conductor';
  seats: number;
  pickup_point: string | null;
  days_of_week: number[] | null;
  note: string | null;
  status: CommitmentStatus;
  created_at: string;
  user?: Profile;
  trip?: Trip;
}

export interface Trip {
  id: string;
  owner_id: string;
  kind: TripKind;
  category: string;
  origin: string;
  destination: string;
  pickup_points: string[];
  schedule: Schedule;
  trip_date: string | null;
  days_of_week: number[] | null;
  valid_until: string | null;
  departure_time: string;
  return_time: string | null;
  duration_min: number | null;
  seats: number;
  vehicle_id: string | null;
  description: string | null;
  status: 'activo' | 'cancelado';
  created_at: string;
  owner?: Profile;
  vehicle?: Vehicle | null;
  commitments?: Commitment[];
}

export interface Proposal {
  id: string;
  trip_id: string;
  proposer_id: string;
  new_trip_date: string | null;
  new_days_of_week: number[] | null;
  new_departure_time: string | null;
  new_return_time: string | null;
  new_origin: string | null;
  new_destination: string | null;
  new_pickup_point: string | null;
  message: string;
  status: ProposalStatus;
  response: string | null;
  created_at: string;
  proposer?: Profile;
}
