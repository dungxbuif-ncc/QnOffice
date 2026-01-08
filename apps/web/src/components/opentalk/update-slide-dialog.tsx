'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { opentalkClientService } from '@/shared/services/client/opentalk-client-service';
import { ApiResponse } from '@qnoffice/shared';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs';
import axios from 'axios';
import { Upload, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface UpdateSlideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: number;
  eventTitle: string;
  onSuccess?: () => void;
}

export function UpdateSlideDialog({
  open,
  onOpenChange,
  eventId,
  eventTitle,
  onSuccess,
}: UpdateSlideDialogProps) {
  const [slidesUrl, setSlidesUrl] = useState('');
  const [topic, setTopic] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('url');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (open && eventId) {
      fetchExistingSlide();
    } else if (!open) {
      // Reset state when dialog closes
      setSlidesUrl('');
      setTopic('');
      setNotes('');
      setSelectedFile(null);
      setUploadMethod('url');
    }
  }, [open, eventId]);

  const fetchExistingSlide = async () => {
    if (!eventId) return;

    setIsFetching(true);
    try {
      const submission =
        await opentalkClientService.getSlideSubmission(eventId);
      if (submission) {
        setSlidesUrl(submission.slidesUrl || '');
        setTopic(submission.topic || '');
        setNotes(submission.notes || '');
      } else {
        setSlidesUrl('');
        setTopic('');
        setNotes('');
      }
    } catch (error) {
      console.error('Failed to fetch slide submission:', error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalUrl = slidesUrl.trim();

    if (uploadMethod === 'file') {
      if (!selectedFile) {
        toast.error('Please select a file to upload');
        return;
      }

      setIsUploading(true);
      try {
        const { data: apiResponse } = await axios.post<
          ApiResponse<Array<{ uploadUrl: string; fileUrl: string }>>
        >('/api/upload/presigned-urls/opentalk', {
          files: [
            {
              fileName: selectedFile.name,
              contentType: selectedFile.type,
            },
          ],
        });

        const presignedData = apiResponse.data[0];

        await axios.put(presignedData.uploadUrl, selectedFile, {
          headers: {
            'Content-Type': selectedFile.type,
          },
        });

        finalUrl = presignedData.fileUrl;
      } catch (error) {
        toast.error('Failed to upload file');
        console.error(error);
        setIsUploading(false);
        return;
      } finally {
        setIsUploading(false);
      }
    } else {
      if (!finalUrl) {
        toast.error('Please enter a slides URL');
        return;
      }
    }

    setIsLoading(true);
    try {
      await opentalkClientService.submitSlide({
        eventId,
        slidesUrl: finalUrl,
        topic: topic.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      toast.success('Slide submitted successfully');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error('Failed to submit slide');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = [
        'application/pdf',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      ];
      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a PDF or PowerPoint file');
        return;
      }
      setSelectedFile(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  const handleClose = () => {
    if (!isLoading) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Update Slide</DialogTitle>
          <DialogDescription>
            Submit or update the slide for <strong>{eventTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        {isFetching ? (
          <div className="py-8 text-center text-muted-foreground">
            Loading...
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <Tabs
                value={uploadMethod}
                onValueChange={(value) =>
                  setUploadMethod(value as 'url' | 'file')
                }
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="url">Link URL</TabsTrigger>
                  <TabsTrigger value="file">Upload File</TabsTrigger>
                </TabsList>

                <TabsContent value="url" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="slidesUrl">
                      Slides URL <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="slidesUrl"
                      type="url"
                      placeholder="https://docs.google.com/presentation/..."
                      value={slidesUrl}
                      onChange={(e) => setSlidesUrl(e.target.value)}
                      required={uploadMethod === 'url'}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="file" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fileUpload">
                      Upload Slide File <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="fileUpload"
                        type="file"
                        accept=".pdf,.ppt,.pptx"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          document.getElementById('fileUpload')?.click()
                        }
                        className="w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {selectedFile
                          ? 'Change File'
                          : 'Select PDF or PowerPoint'}
                      </Button>
                    </div>
                    {selectedFile && (
                      <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                        <span className="text-sm truncate">
                          {selectedFile.name}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={removeFile}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              <div className="space-y-2">
                <Label htmlFor="topic">Topic</Label>
                <Input
                  id="topic"
                  placeholder="Presentation topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes or comments"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading || isUploading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || isUploading}>
                {isUploading
                  ? 'Uploading...'
                  : isLoading
                    ? 'Submitting...'
                    : 'Submit Slide'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
