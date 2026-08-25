import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  UpdateData,
  updateDoc,
  where,
} from "firebase/firestore";
import { EventInterface } from "@/app/components/interfaces/event";
import { QrCodeInterface } from "@/app/components/interfaces/qrCode";
import { PaymentStatusInterface } from "@/app/components/interfaces/paymentStatus";
import { LoginGooglePropsInterface } from "@/app/components/interfaces/loginGoogleProps";
import { db } from "./admin";
import { firestore } from "./init";

function serializeFirestoreDoc(docId: string, rawData: any): any {
  if (!rawData) return null;
  const result: any = { id: docId, ...rawData };

  if (result.timestamp) {
    if (typeof result.timestamp.seconds === "number") {
      result.timestamp = {
        seconds: result.timestamp.seconds,
        nanoseconds: result.timestamp.nanoseconds ?? 0,
      };
    } else if (typeof result.timestamp._seconds === "number") {
      result.timestamp = {
        seconds: result.timestamp._seconds,
        nanoseconds: result.timestamp._nanoseconds ?? 0,
      };
    }
  }

  if (result.closeTime) {
    if (typeof result.closeTime.seconds === "number") {
      result.closeTime = {
        seconds: result.closeTime.seconds,
        nanoseconds: result.closeTime.nanoseconds ?? 0,
      };
    } else if (typeof result.closeTime._seconds === "number") {
      result.closeTime = {
        seconds: result.closeTime._seconds,
        nanoseconds: result.closeTime._nanoseconds ?? 0,
      };
    }
  }

  if (result.isSoldout !== undefined) {
    result.isSoldOut = result.isSoldout;
  }

  // Ensure 100% plain serializable object for Next.js Server Component boundary
  return JSON.parse(JSON.stringify(result));
}

export async function retrieveData(collectionName: string) {
  try {
    if (db) {
      const snapshot = await db.collection(collectionName).get();
      if (!snapshot.empty) {
        return snapshot.docs.map((doc) => serializeFirestoreDoc(doc.id, doc.data()));
      }
    }
  } catch (err) {
    console.warn(`Admin retrieveData failed for ${collectionName}:`, err);
  }

  try {
    const snapshot = await getDocs(collection(firestore, collectionName));
    return snapshot.docs.map((doc) => serializeFirestoreDoc(doc.id, doc.data()));
  } catch (err) {
    console.error(`Client retrieveData failed for ${collectionName}:`, err);
    return [];
  }
}

export async function retrieveDataById(collectionName: string, id: string) {
  try {
    if (db) {
      const snapshot = await db.collection(collectionName).doc(id).get();
      if (snapshot.exists) {
        return serializeFirestoreDoc(snapshot.id, snapshot.data());
      }
    }
  } catch (err) {
    console.warn(`Admin retrieveDataById failed for ${collectionName}/${id}:`, err);
  }

  try {
    const snapshot = await getDoc(doc(firestore, collectionName, id));
    if (snapshot.exists()) {
      return serializeFirestoreDoc(snapshot.id, snapshot.data());
    }
  } catch (err) {
    console.error(`Client retrieveDataById failed for ${collectionName}/${id}:`, err);
  }

  return null;
}

export async function retrieveDataByField(
  collectionName: string,
  field: string,
  value: string
) {
  try {
    if (db) {
      const snap = await db.collection(collectionName).where(field, "==", value).get();
      if (!snap.empty) {
        return snap.docs.map((doc) => serializeFirestoreDoc(doc.id, doc.data()));
      }
    }
  } catch (err) {
    console.warn(`Admin retrieveDataByField failed for ${collectionName}:`, err);
  }

  try {
    const q = query(
      collection(firestore, collectionName),
      where(field, "==", value)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => serializeFirestoreDoc(doc.id, doc.data()));
  } catch (err) {
    console.error(`Client retrieveDataByField failed for ${collectionName}:`, err);
    return [];
  }
}

export async function addData(
  collectionName: string,
  data:
    | EventInterface
    | QrCodeInterface
    | PaymentStatusInterface
    | LoginGooglePropsInterface
) {
  try {
    if (db) {
      const docRef = await db.collection(collectionName).add(data as any);
      return {
        status: true,
        statusCode: 200,
        message: "Data added successfully",
        id: docRef.id,
      };
    }
    await addDoc(collection(firestore, collectionName), data);
    return {
      status: true,
      statusCode: 200,
      message: "Data added successfully",
    };
  } catch (err: unknown) {
    if (err instanceof Error) {
      return { status: false, statusCode: 500, message: err.message };
    }
    return { status: false, statusCode: 500, message: "Update failed" };
  }
}

export async function updateData(
  collectionName: string,
  id: string,
  data: UpdateData<EventInterface | QrCodeInterface | PaymentStatusInterface>
) {
  try {
    if (db) {
      await db.collection(collectionName).doc(id).update(data as any);
      return {
        status: true,
        statusCode: 200,
        message: "Data updated successfully",
      };
    }
    await updateDoc(doc(firestore, collectionName, id), data);
    return {
      status: true,
      statusCode: 200,
      message: "Data updated successfully",
    };
  } catch (err: unknown) {
    if (err instanceof Error) {
      return { status: false, statusCode: 500, message: err.message };
    }
    return { status: false, statusCode: 500, message: "Update failed" };
  }
}

export async function deleteById(collectionName: string, id: string) {
  try {
    if (db) {
      await db.collection(collectionName).doc(id).delete();
      return {
        status: true,
        statusCode: 200,
        message: "Data deleted successfully",
      };
    }
    await deleteDoc(doc(firestore, collectionName, id));
    return {
      status: true,
      statusCode: 200,
      message: "Data deleted successfully",
    };
  } catch (err: unknown) {
    if (err instanceof Error) {
      return {
        status: false,
        statusCode: 500,
        message: err.message,
      };
    }
    return {
      status: false,
      statusCode: 500,
      message: "Failed to delete data",
    };
  }
}

export async function loginWithGoogle(data: LoginGooglePropsInterface) {
  const user: LoginGooglePropsInterface[] = (await retrieveDataByFieldAdmin(
    "users",
    "email",
    data.email
  )) as LoginGooglePropsInterface[];
  if (user.length > 0) {
    data.role = user[0].role;
    data.name = user[0].name;
    data.id = user[0].id;
    return { status: true, user: data };
  } else {
    data.role = "user";
    const id = await db
      .collection("users")
      .add(data)
      .then((docRef) => {
        return docRef.id;
      });
    const user = { id, email: data.email, role: "user" };
    return { status: true, user };
  }
}

// admin ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

export async function retrieveDataByFieldAdmin(
  collectionName: string,
  field: string,
  value: string
) {
  try {
    const snap = await db
      .collection(collectionName)
      .where(field, "==", value)
      .get();

    if (snap.empty) {
      return [];
    }

    return snap.docs.map((doc) => serializeFirestoreDoc(doc.id, doc.data()));
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw new Error(`Failed to retrieve data: ${err.message}`);
    }
    throw new Error(`Failed to retrieve data`);
  }
}
