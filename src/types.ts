export type WebsiteType = 'Business Website' | 'Online Store' | 'Portfolio' | 'Other';
export type DesignStyle = 'Modern' | 'Luxury' | 'Minimal' | 'Fashion Store' | 'Traditional';
export type ProjectStatus = 'New' | 'In Progress' | 'Completed';

export interface Submission {
  id: string;
  createdAt: string;
  status: ProjectStatus;
  
  // Business Info
  businessName: string;
  ownerName: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;

  // Website Requirements
  websiteType: WebsiteType | string;
  onlineOrdering: boolean;
  whatsappIntegration: boolean;
  googleMaps: boolean;

  // Design Preferences
  colors: string;
  designStyle: DesignStyle;
  exampleLinks: string;
  designNotes: string;

  // Branding
  logo: string; // Base64 or URL
  brandDescription: string;
  tagline: string;

  // Content
  aboutBusiness: string;
  services: string;
  workingHours: string;
  socialMedia: string;

  // Additional
  specialFeatures: string;
  extraNotes: string;
  adminNotes?: string;
}

export interface AppSettings {
  googleAppsScriptUrl: string;
}
