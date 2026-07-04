import type { Metadata } from "next";
import FormFillClient from "./FormFillClient";

export const metadata: Metadata = {
  title: "Form",
  description: "Fill in a Binectics form.",
};

export default function PublicFormFillPage() {
  return <FormFillClient />;
}
