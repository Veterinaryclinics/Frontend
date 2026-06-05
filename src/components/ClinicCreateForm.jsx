import React, { useRef, useState } from "react";
import {
  FileText,
  ImagePlus,
  X,
  UploadCloud,
} from "lucide-react";

const DESCRIPTION_MAX_LENGTH = 200;
const MAX_IMAGES = 5;
const MAX_DOCUMENTS = 1;
const MAX_IMAGE_SIZE_MB = 5;
const MAX_DOCUMENT_SIZE_MB = 10;

const imageSizeLimit = MAX_IMAGE_SIZE_MB * 1024 * 1024;
const documentSizeLimit = MAX_DOCUMENT_SIZE_MB * 1024 * 1024;

const ClinicCreateForm = ({ onCreateClinic, isCreatingClinic, onCancel }) => {
  const imageInputRef = useRef(null);
  const documentInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phoneNumber: "",
    description: "",
  });

  const [clinicImages, setClinicImages] = useState([]);
  const [documentFile, setDocumentFile] = useState(null);
  const [fileError, setFileError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "description" && value.length > DESCRIPTION_MAX_LENGTH) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImagesChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFileError("");

    if (selectedFiles.length === 0) return;

    const currentCount = clinicImages.length;
    const availableSlots = MAX_IMAGES - currentCount;

    if (availableSlots <= 0) {
      setFileError(`You can upload a maximum of ${MAX_IMAGES} clinic images.`);
      e.target.value = "";
      return;
    }

    const acceptedFiles = [];

    for (const file of selectedFiles.slice(0, availableSlots)) {
      if (!file.type.startsWith("image/")) {
        setFileError("Only image files are allowed for clinic images.");
        continue;
      }

      if (file.size > imageSizeLimit) {
        setFileError(`Each image must be less than ${MAX_IMAGE_SIZE_MB}MB.`);
        continue;
      }

      acceptedFiles.push({
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    setClinicImages((prev) => [...prev, ...acceptedFiles]);

    if (selectedFiles.length > availableSlots) {
      setFileError(
        `Only ${MAX_IMAGES} images are allowed. Extra images were ignored.`
      );
    }

    e.target.value = "";
  };

  const handleDocumentChange = (e) => {
    const selectedFile = e.target.files?.[0];
    setFileError("");

    if (!selectedFile) return;

    if (selectedFile.size > documentSizeLimit) {
      setFileError(`Document must be less than ${MAX_DOCUMENT_SIZE_MB}MB.`);
      e.target.value = "";
      return;
    }

    setDocumentFile(selectedFile);
    e.target.value = "";
  };

  const removeImage = (indexToRemove) => {
    setClinicImages((prev) => {
      const imageToRemove = prev[indexToRemove];

      if (imageToRemove?.previewUrl) {
        URL.revokeObjectURL(imageToRemove.previewUrl);
      }

      return prev.filter((_, index) => index !== indexToRemove);
    });
  };

  const removeDocument = () => {
    setDocumentFile(null);

    if (documentInputRef.current) {
      documentInputRef.current.value = "";
    }
  };

  const resetForm = () => {
    clinicImages.forEach((image) => {
      if (image.previewUrl) URL.revokeObjectURL(image.previewUrl);
    });

    setFormData({
      name: "",
      address: "",
      phoneNumber: "",
      description: "",
    });

    setAvailability(DEFAULT_AVAILABILITY);
    setClinicImages([]);
    setDocumentFile(null);
    setFileError("");

    if (imageInputRef.current) imageInputRef.current.value = "";
    if (documentInputRef.current) documentInputRef.current.value = "";
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setFileError("");

  if (!documentFile) {
    setFileError("Please upload one verification document.");
    return;
  }

  if (clinicImages.length > MAX_IMAGES) {
    setFileError(`You can upload a maximum of ${MAX_IMAGES} clinic images.`);
    return;
  }

  if (documentFile && documentFile.size > documentSizeLimit) {
    setFileError(`Document must be less than ${MAX_DOCUMENT_SIZE_MB}MB.`);
    return;
  }

  const requestData = new FormData();

  requestData.append("Name", formData.name);
  requestData.append("Address", formData.address);
  requestData.append("PhoneNumber", formData.phoneNumber);
  requestData.append("Description", formData.description);

  requestData.append("Documents", documentFile);

  clinicImages.forEach((image) => {
    requestData.append("ClinicImages", image.file);
  });

  console.log("CLINIC REQUEST FORM DATA:");
  for (const [key, value] of requestData.entries()) {
    console.log(key, value);
  }

  const success = await onCreateClinic(requestData);

  if (success) {
    resetForm();
  }
};

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-base-300 rounded-2xl p-5 bg-base-100 w-full max-w-md mx-auto"
    >
      <div className="text-center mb-5">
        <h2 className="font-semibold text-base-content">
          Submit Clinic Request
        </h2>

        <p className="text-xs text-base-content/60 mt-1">
          Your clinic will be reviewed by the admin before it becomes active.
        </p>
      </div>

      <label className="block mb-2 text-sm text-base-content">
        Clinic Name
      </label>
      <input
        type="text"
        name="name"
        placeholder="Petzy Vet Clinic"
        className="input input-bordered w-full mb-4"
        value={formData.name}
        onChange={handleChange}
        required
      />

      <label className="block mb-2 text-sm text-base-content">
        Address
      </label>
      <input
        type="text"
        name="address"
        placeholder="Clinic address"
        className="input input-bordered w-full mb-4"
        value={formData.address}
        onChange={handleChange}
        required
      />

      <label className="block mb-2 text-sm text-base-content">
        Phone Number
      </label>
      <input
        type="tel"
        name="phoneNumber"
        placeholder="01018842808"
        className="input input-bordered w-full mb-4"
        value={formData.phoneNumber}
        onChange={handleChange}
        required
      />

      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm text-base-content">Description</label>

        <span className="text-xs text-base-content/50">
          {formData.description.length}/{DESCRIPTION_MAX_LENGTH}
        </span>
      </div>

      <textarea
        name="description"
        placeholder="Briefly describe your clinic services, location, or specialties..."
        className="textarea textarea-bordered w-full mb-5 min-h-24 resize-none"
        value={formData.description}
        onChange={handleChange}
        maxLength={DESCRIPTION_MAX_LENGTH}
        required
      />

      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm text-base-content">
            Verification Document
          </label>

          <span className="text-xs text-base-content/50">
            {documentFile ? "1" : "0"}/1
          </span>
        </div>

        <input
          ref={documentInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleDocumentChange}
        />

        {documentFile ? (
          <div className="border border-base-300 rounded-xl p-3 flex items-center justify-between gap-3 bg-base-200">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <FileText size={18} />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-medium text-base-content truncate">
                  {documentFile.name}
                </p>
                <p className="text-xs text-base-content/50">
                  Verification document
                </p>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-ghost btn-xs btn-circle"
              onClick={removeDocument}
              disabled={isCreatingClinic}
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="w-full border border-dashed border-base-300 rounded-xl p-4 text-sm text-base-content/60 hover:border-primary/50 hover:bg-primary/5 transition flex flex-col items-center gap-2"
            onClick={() => documentInputRef.current?.click()}
            disabled={isCreatingClinic}
          >
            <UploadCloud size={22} className="text-primary" />
            Upload one license, registration, or verification document
            <span className="text-xs text-base-content/40">
              PDF up to {MAX_DOCUMENT_SIZE_MB}MB
            </span>
          </button>
        )}
      </div>

      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm text-base-content">
            Clinic Images
          </label>

          <span className="text-xs text-base-content/50">
            {clinicImages.length}/{MAX_IMAGES}
          </span>
        </div>

        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleImagesChange}
        />

        <button
          type="button"
          className="w-full border border-dashed border-base-300 rounded-xl p-4 text-sm text-base-content/60 hover:border-primary/50 hover:bg-primary/5 transition flex flex-col items-center gap-2"
          onClick={() => imageInputRef.current?.click()}
          disabled={isCreatingClinic || clinicImages.length >= MAX_IMAGES}
        >
          <ImagePlus size={22} className="text-primary" />
          Upload clinic images
          <span className="text-xs text-base-content/40">
            Up to {MAX_IMAGES} images, {MAX_IMAGE_SIZE_MB}MB each
          </span>
        </button>

        {clinicImages.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-3">
            {clinicImages.map((image, index) => (
              <div
                key={`${image.file.name}-${index}`}
                className="relative rounded-xl overflow-hidden border border-base-300 bg-base-200 aspect-square"
              >
                <img
                  src={image.previewUrl}
                  alt={`Clinic preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />

                <button
                  type="button"
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center"
                  onClick={() => removeImage(index)}
                  disabled={isCreatingClinic}
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {fileError && (
        <div className="alert alert-warning text-sm mb-5 py-2">
          {fileError}
        </div>
      )}

      <div className="rounded-xl bg-warning/10 border border-warning/20 p-3 mb-5">
        <p className="text-xs text-base-content/70">
          Submitting this form sends a clinic creation request to the admin.
          The clinic will only become available after approval.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          className="btn btn-outline flex-1 rounded-xl"
          onClick={onCancel}
          disabled={isCreatingClinic}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="btn btn-primary flex-1 rounded-xl"
          disabled={isCreatingClinic}
        >
          {isCreatingClinic ? "Submitting..." : "Submit Request"}
        </button>
      </div>
    </form>
  );
};

export default ClinicCreateForm;