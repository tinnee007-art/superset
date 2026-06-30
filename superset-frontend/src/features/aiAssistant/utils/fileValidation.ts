export const validateFile = (file: File): string | null => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'application/pdf',
  ];

  if (!allowedTypes.includes(file.type)) {
    return 'Only JPG, PNG, PDF allowed';
  }

  if (file.size > 5 * 1024 * 1024) {
    return 'Max file size is 5MB';
  }

  return null;
};