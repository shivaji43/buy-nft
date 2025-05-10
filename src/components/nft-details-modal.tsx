"use client"
import { ChevronRight, Copy, Check } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useState } from "react"
import type { NftDetail } from "@/utils/types"

interface NftDetailsModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  nftDetail: NftDetail | null
  isLoading: boolean
  error: string | null
}

export function NftDetailsModal({ isOpen, onOpenChange, nftDetail, isLoading, error }: NftDetailsModalProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(field);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl lg:max-w-7xl md:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{nftDetail?.name || "NFT Details"}</DialogTitle>
          {nftDetail?.collectionName && <DialogDescription>Collection: {nftDetail.collectionName}</DialogDescription>}
        </DialogHeader>

        {isLoading && (
          <div className="py-12 flex flex-col items-center justify-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center text-destructive">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {nftDetail && !isLoading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative aspect-square bg-muted/30 rounded-lg overflow-hidden">
              <img
                src={nftDetail.image || "/placeholder.svg"}
                alt={nftDetail.name}
                className="w-full h-full object-contain"
                loading="lazy"
              />
            </div>
            <div className="space-y-4">
              {nftDetail.description && (
                <div className="space-y-2">
                  <h4 className="font-medium">Description</h4>
                  <p className="text-sm text-muted-foreground">{nftDetail.description}</p>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="font-medium">Attributes</h4>
                {nftDetail.attributes && nftDetail.attributes.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {nftDetail.attributes.map((attr, index) => (
                      <div key={index} className="bg-muted/50 border rounded-md px-3 py-2 text-center">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          {attr.trait_type}
                        </p>
                        <p className="text-sm font-semibold " title={String(attr.value)}>
                          {String(attr.value)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No attributes listed.</p>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-medium">Details</h4>
                <div className="text-xs space-y-2">
                  <TooltipProvider>
                    <div className="flex justify-left items-center">
                      <span className="font-medium mr-2">Mint:</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 mr-1" 
                        onClick={() => copyToClipboard(nftDetail.mintAddress, "mint")}
                        title="Copy to clipboard"
                      >
                        {copied === "mint" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="max-w-[200px] inline-block">{nftDetail.mintAddress}</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="break-all max-w-[300px]">{nftDetail.mintAddress}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>

                    <div className="flex justify-left items-center">
                      <span className="font-medium mr-2">Owner:</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 mr-1" 
                        onClick={() => copyToClipboard(nftDetail.owner, "owner")}
                        title="Copy to clipboard"
                      >
                        {copied === "owner" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="max-w-[200px] inline-block">{nftDetail.owner}</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="break-all max-w-[300px]">{nftDetail.owner}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>

                    <div className="flex justify-left items-center">
                      <span className="font-medium mr-2">Update Authority:</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 mr-1" 
                        onClick={() => copyToClipboard(nftDetail.updateAuthority, "updateAuthority")}
                        title="Copy to clipboard"
                      >
                        {copied === "updateAuthority" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="max-w-[200px] inline-block">{nftDetail.updateAuthority}</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="break-all max-w-[300px]">{nftDetail.updateAuthority}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TooltipProvider>

                  <div className="flex justify-left">
                    <span className="font-medium">Seller Fee:</span>
                    <span className="px-2">{nftDetail.sellerFeeBasisPoints / 100}%</span>
                  </div>
                </div>
              </div>

              {nftDetail.externalUrl && (
                <Button variant="outline" asChild className="w-full mt-4">
                  <a
                    href={nftDetail.properties?.files?.[0]?.uri || nftDetail.properties?.files?.[0]?.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2"
                  >
                    High Res Image
                    <ChevronRight className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}