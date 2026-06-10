import { Submission } from '../types';
import { db, auth } from './firebase';
import { collection, doc, setDoc, updateDoc, getDocs, onSnapshot, query, orderBy } from 'firebase/firestore';
import emailjs from '@emailjs/browser';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Save a new submission from public client side
export const saveSubmission = async (submission: Submission): Promise<void> => {
  const submissionPath = `submissions/${submission.id}`;
  try {
    await setDoc(doc(db, 'submissions', submission.id), submission);

    // Send emails via EmailJS
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const adminTemplateId = import.meta.env.VITE_EMAILJS_ADMIN_TEMPLATE_ID;
    const clientTemplateId = import.meta.env.VITE_EMAILJS_CLIENT_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    if (serviceId && publicKey) {
      // 1. Notify Admin
      if (adminTemplateId) {
        emailjs.send(serviceId, adminTemplateId, {
          to_email: 'nixxal54@gmail.com', // fallback/hardcoded or specific admin email
          email: 'nixxal54@gmail.com', // in case template uses {{email}}
          business_name: submission.businessName || 'Unnamed Business',
          owner_name: submission.ownerName || 'Not provided',
          client_email: submission.email,
          website_type: submission.websiteType,
          reply_to: submission.email,
        }, publicKey).catch(e => console.error('Failed to send admin email:', e));
      }

      // 2. Notify Client
      if (clientTemplateId && submission.email) {
        emailjs.send(serviceId, clientTemplateId, {
          to_email: submission.email,
          email: submission.email, // matches {{email}} from client template
          reply_to: 'nixxal54@gmail.com', // admin email
          to_name: submission.ownerName || submission.businessName || 'Client',
          business_name: submission.businessName,
        }, publicKey).catch(e => console.error('Failed to send client email:', e));
      }
    } else {
      console.warn("EmailJS is not configured. Missing Service ID or Public Key in environment variables.", { serviceId, publicKey });
    }

  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, submissionPath);
  }
};

// Update submission status (requires auth)
export const updateSubmissionStatus = async (id: string, status: Submission['status']) => {
  const docPath = `submissions/${id}`;
  try {
    await updateDoc(doc(db, 'submissions', id), { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
};

export const updateSubmissionNotes = async (id: string, adminNotes: string) => {
  const docPath = `submissions/${id}`;
  try {
    await updateDoc(doc(db, 'submissions', id), { adminNotes });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
};

export const deleteSubmission = async (id: string) => {
  const docPath = `submissions/${id}`;
  try {
    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(doc(db, 'submissions', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
};

export const testEmailConfiguration = async (testEmail: string) => {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const adminTemplateId = import.meta.env.VITE_EMAILJS_ADMIN_TEMPLATE_ID;
  const clientTemplateId = import.meta.env.VITE_EMAILJS_CLIENT_TEMPLATE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  const missing = [];
  if (!serviceId) missing.push("VITE_EMAILJS_SERVICE_ID");
  if (!publicKey) missing.push("VITE_EMAILJS_PUBLIC_KEY");
  if (!adminTemplateId && !clientTemplateId) missing.push("At least one Template ID (Admin or Client)");

  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(", ")}. Please make sure your keys in AI Studio settings start with VITE_`);
  }

  const adminResult = adminTemplateId ? await emailjs.send(serviceId, adminTemplateId, {
    to_email: 'nixxal54@gmail.com', // Admin template {{to_email}}
    email: 'nixxal54@gmail.com', // Admin template {{email}}
    business_name: 'Test Business (Demo)',
    owner_name: 'Demo Owner',
    client_email: testEmail,
    website_type: 'E-commerce Demo',
    reply_to: testEmail,
  }, publicKey) : null;

  const clientResult = clientTemplateId ? await emailjs.send(serviceId, clientTemplateId, {
    to_email: testEmail, // just in case
    email: testEmail,    // matches {{email}} from screenshot 1
    reply_to: 'nixxal54@gmail.com',
    to_name: 'Demo Client',
    business_name: 'Test Business (Demo)',
  }, publicKey) : null;

  return { adminResult, clientResult };
};
