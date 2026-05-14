export const toTextContent = (data: unknown) => ({
  content: [
    {
      type: "text" as const,
      text: JSON.stringify(data, null, 2),
    },
  ],
});

export const toMessageContent = (message: string) => ({
  content: [
    {
      type: "text" as const,
      text: message,
    },
  ],
});
