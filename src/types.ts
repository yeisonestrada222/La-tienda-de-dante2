export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  imageUrl: string;
  badge?: string;
  features: string[];
  specs: { [key: string]: string };
  dropiCost: number; // Simulated cost in Dropi for dropshipping margin calculator
  rating: number;
  reviewsCount: number;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
  avatarUrl?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  product?: string;
  date: string;
}
