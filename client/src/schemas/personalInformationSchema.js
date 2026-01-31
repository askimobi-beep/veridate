import { z } from "zod";

const personalInformationSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  fatherName: z.string().min(2, "Father's name is required"),
  mobile: z
    .string()
    .regex(/^03\d{9}$/, "Mobile must start with 03 and be 11 digits"),
  cnic: z
    .string()
    .regex(/^\d{5}-\d{7}-\d$/, "CNIC format must be 12345-1234567-1"),
  street: z.string().min(1, "Street is required"),
  city: z.string().min(1, "City is required"),
  country: z.string().min(1, "Country is required"),
  gender: z.enum(["Male", "Female", "Other"], {
    errorMap: () => ({ message: "Gender must be Male, Female or Other" }),
  }),
  maritalStatus: z.enum(["Single", "Married", "Other"], {
    errorMap: () => ({ message: "Marital status must be Single, Married or Other" }),
  }),
  residentStatus: z.enum(["Temporary", "Permanent"], {
    errorMap: () => ({ message: "Resident status must be Temporary or Permanent" }),
  }),
  nationality: z.string().min(1, "Nationality is required"),
  dob: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Date of birth must be month/year (YYYY-MM)"),
  resume: z.any().optional(),
  profilePic: z.any().optional(),
});

export default personalInformationSchema;
