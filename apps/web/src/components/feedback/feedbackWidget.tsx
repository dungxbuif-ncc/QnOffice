import { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ApiResponse } from '@qnoffice/shared';

type Message = {
  id: number;
  text?: string;
  images?: string[];
  from: 'user' | 'bot';
};

export default function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: '👋 Xin chào! Tôi có thể giúp gì cho bạn?', from: 'bot' },
  ]);

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith('image')) {
        const file = item.getAsFile();
        if (file) {
          setImages((prev) => [...prev, file]);
        }
      }
    }
  };

  const sendMessage = async () => {
    if (!input.trim() && images.length === 0) return;

    try {
      // Optimistic UI
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          text: input || undefined,
          images: images[0]
            ? [URL.createObjectURL(images[0])]
            : [],
          from: 'user',
        },
      ]);

      let imageKey: string | undefined;

      if (images.length > 0) {
        const file = images[0];

        const response = await fetch('/api/upload/presigned-url-public', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            contentType: file.type,
            folder: 'feedback/temp',
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get presigned url');
        }

        const { uploadUrl, key }: { uploadUrl: string; key: string } =
          (await response.json()).data;

        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type,
          },
          body: file,
        });

        if (!uploadResponse.ok) {
          throw new Error('Upload failed');
        }

        imageKey = key;
      }

      const payload = {
        text: input,
        imageKey, 
      };

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      setInput('');
      setImages([]);

      // Bot reply
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            text: response.ok
              ? 'Mình đã nhận được feedback 👍'
              : 'Đã xảy ra lỗi!',
            from: 'bot',
          },
        ]);
      }, 600);
    } catch (error) {
      console.error(error);
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            text: 'Đã xảy ra lỗi!',
            from: 'bot',
          },
        ]);
      }, 600);
    }
  };

  return (
    <>
      {open && (
        <div className="fixed bottom-20 right-6 w-80 h-96 bg-white rounded-2xl shadow-xl border z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b">
            <span className="font-semibold text-sm">Feedback Chat</span>
            <button onClick={() => setOpen(false)}>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-3 space-y-2 overflow-y-auto text-sm">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[75%] rounded-lg px-3 py-2 space-y-1 ${
                  m.from === 'user'
                    ? 'ml-auto bg-blue-600 text-white'
                    : 'mr-auto bg-gray-100 text-gray-800'
                }`}
              >
                {m.text && <p>{m.text}</p>}

                {m.images && (
                  <div className="flex gap-2 flex-wrap">
                    {m.images.map((src, i) => (
                      <img
                        key={i}
                        src={src}
                        className="h-20 w-20 rounded object-cover border"
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Preview images */}
          {images.length > 0 && (
            <div className="flex gap-2 px-2 pb-1 overflow-x-auto">
              {images.map((img, idx) => (
                <div key={idx} className="relative">
                  <img
                    src={URL.createObjectURL(img)}
                    className="h-14 w-14 rounded object-cover border"
                  />
                  <button
                    onClick={() =>
                      setImages((prev) => prev.filter((_, i) => i !== idx))
                    }
                    className="absolute -top-1 -right-1 bg-black text-white rounded-full text-xs px-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex items-end gap-2 p-2 border-t">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onPaste={handlePaste}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Nhập tin nhắn (Ctrl + V để dán ảnh)"
              className="flex-1 resize-none rounded-md border px-3 py-2 text-sm focus:outline-none"
              rows={2}
            />
            <Button size="icon" onClick={sendMessage}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Bubble */}
      <Button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 rounded-full w-14 h-14 p-0 shadow-lg z-50"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    </>
  );
}
