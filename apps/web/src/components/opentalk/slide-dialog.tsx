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
import {
  ApiResponse,
  IOpentalEventMetadata,
  ScheduleEvent,
} from '@qnoffice/shared';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs';
import axios from 'axios';
import { ExternalLink, Upload, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface SlideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: ScheduleEvent<IOpentalEventMetadata>;
  mode: 'view' | 'edit';
  canEdit?: boolean;
  onSuccess?: () => void;
}

export function SlideDialog({
  open,
  onOpenChange,
  event,
  mode,
  canEdit = false,
  onSuccess,
}: SlideDialogProps) {
  const metadata = event?.metadata;
  const hasExistingSlide = !!metadata?.slideKey;
  const isViewMode = mode === 'view' || (mode === 'edit' && !canEdit);
  const [slidesUrl, setSlidesUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('url');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [presignedUrl, setPresignedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (open && mode === 'edit') {
      setSlidesUrl('');
      setPresignedUrl(null);
    } else if (!open) {
      setSlidesUrl('');
      setSelectedFile(null);
      setUploadMethod('url');
      setPresignedUrl(null);
    }

    if (open && metadata?.slideKey) {
      fetchPresignedUrl();
    }
  }, [open, mode, metadata?.slideKey]);

  const fetchPresignedUrl = async () => {
    if (!metadata?.slideKey) return;

    try {
      const response = await axios.post(
        '/api/upload/presigned-url/opentalk/view',
        {
          slideKey: metadata.slideKey,
        },
      );
      setPresignedUrl(response.data.downloadUrl);
    } catch (error) {
      console.error('Failed to fetch presigned URL:', error);
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
      await axios.post('/api/opentalk/slides/submit', {
        eventId: event.id,
        slidesUrl: finalUrl,
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
    if (!isLoading && !isUploading) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>{isViewMode ? 'View' : 'Update'} Slide</DialogTitle>
          <DialogDescription>
            {isViewMode
              ? 'Slide submission for'
              : 'Submit or update the slide for'}{' '}
            <strong>{event.title}</strong>
          </DialogDescription>
        </DialogHeader>

        {isViewMode ? (
          <>
            {metadata?.slideKey ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Slide Preview</Label>
                  <div className="flex items-center justify-center p-8 border rounded-lg bg-muted/30">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() =>
                        presignedUrl && window.open(presignedUrl, '_blank')
                      }
                      disabled={!presignedUrl}
                      className="gap-2"
                    >
                      <ExternalLink className="h-5 w-5" />
                      {presignedUrl ? 'Download Slide' : 'Loading...'}
                    </Button>
                  </div>
                </div>

                {metadata.status && (
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <p className="text-sm capitalize">
                      {metadata.status.toLowerCase()}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No slide submission found for this event.
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {hasExistingSlide && (
                <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">
                      Current Slide
                    </Label>
                    {metadata.status && (
                      <span className="text-xs text-muted-foreground capitalize">
                        {metadata.status.toLowerCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-center p-6 border rounded-md bg-background">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        presignedUrl && window.open(presignedUrl, '_blank')
                      }
                      disabled={!presignedUrl}
                      className="gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {presignedUrl ? 'Preview Slide' : 'Loading...'}
                    </Button>
                  </div>
                </div>
              )}

              <div>
                <Label className="text-sm font-semibold">
                  {hasExistingSlide ? 'Replace with New Slide' : 'Upload Slide'}
                </Label>
                {hasExistingSlide && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload a new slide to replace the current one
                  </p>
                )}
              </div>

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
                      New Slides URL <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="slidesUrl"
                      type="url"
                      placeholder="https://docs.google.com/presentation/..."
                      value={slidesUrl}
                      onChange={(e) => setSlidesUrl(e.target.value)}
                      required={uploadMethod === 'url'}
                    />
                    {hasExistingSlide && (
                      <p className="text-xs text-muted-foreground">
                        Enter a new URL to replace the current slide
                      </p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="file" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fileUpload">
                      New Slide File <span className="text-red-500">*</span>
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
                    {hasExistingSlide && !selectedFile && (
                      <p className="text-xs text-muted-foreground">
                        Select a new file to replace the current slide
                      </p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
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

export const ViewSlideDialog = SlideDialog;
export const UpdateSlideDialog = SlideDialog;
