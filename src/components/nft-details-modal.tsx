
"use client";

import { ChevronRight, Copy, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";
import type { NftDetail } from "@/utils/types";
import { useRouter } from "next/navigation";
interface NftDetailsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  nftDetail: NftDetail | null;
  isLoading: boolean;
  error: string | null;
  darkMode?: boolean;
}

export function NftDetailsModal({
  isOpen,
  onOpenChange,
  nftDetail,
  isLoading,
  error,
  darkMode = false,
}: NftDetailsModalProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(field);
      setTimeout(() => setCopied(null), 2000);
    });
  };
  const router = useRouter();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className={`max-w-6xl lg:max-w-7xl md:max-w-4xl max-h-[90vh] overflow-y-auto ${
          darkMode
            ? "bg-gray-800 border-gray-700 text-gray-100"
            : "bg-[#f5f0ff] border-purple-300 text-gray-900"
        }`}
      >
        <DialogHeader>
          <DialogTitle
            className={`text-2xl ${
              darkMode ? "text-purple-300" : "text-purple-900"
            }`}
          >
            {nftDetail?.name || "NFT Details"}
          </DialogTitle>
          {nftDetail?.collectionName && (
            <DialogDescription
              className={darkMode ? "text-purple-400" : "text-purple-700"}
            >
              Collection: {nftDetail.collectionName}
            </DialogDescription>
          )}
        </DialogHeader>

        {isLoading && (
          <div className="py-12 flex flex-col items-center justify-center gap-4">
            <Skeleton
              className={`h-12 w-12 rounded-full ${
                darkMode ? "bg-gray-700" : "bg-purple-200"
              }`}
            />
            <Skeleton
              className={`h-4 w-32 ${
                darkMode ? "bg-gray-700" : "bg-purple-200"
              }`}
            />
          </div>
        )}

        {error && (
          <div
            className={`rounded-lg border p-4 text-center ${
              darkMode
                ? "border-red-500/50 bg-red-500/10 text-red-400"
                : "border-red-300 bg-red-50 text-red-600"
            }`}
          >
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {nftDetail && !isLoading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              className={`relative aspect-square rounded-lg overflow-hidden shadow-md ${
                darkMode ? "bg-gray-700" : "bg-white"
              }`}
            >
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
                  <h4
                    className={`font-medium ${
                      darkMode ? "text-purple-300" : "text-purple-900"
                    }`}
                  >
                    Description
                  </h4>
                  <p
                    className={`text-sm ${
                      darkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {nftDetail.description}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <h4
                  className={`font-medium ${
                    darkMode ? "text-purple-300" : "text-purple-900"
                  }`}
                >
                  Attributes
                </h4>
                {nftDetail.attributes && nftDetail.attributes.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {nftDetail.attributes.map((attr, index) => (
                      <div
                        key={index}
                        className={`border rounded-md px-3 py-2 text-center shadow-sm ${
                          darkMode
                            ? "bg-gray-700 border-gray-600"
                            : "bg-white border-purple-200"
                        }`}
                      >
                        <p
                          className={`text-xs font-medium uppercase tracking-wide ${
                            darkMode ? "text-purple-400" : "text-purple-600"
                          }`}
                        >
                          {attr.trait_type}
                        </p>
                        <p
                          className={`text-sm font-semibold ${
                            darkMode ? "text-gray-200" : "text-gray-800"
                          }`}
                          title={String(attr.value)}
                        >
                          {String(attr.value)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p
                    className={`text-sm ${
                      darkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    No attributes listed.
                  </p>
                )}
              </div>

              <Separator
                className={darkMode ? "bg-gray-700" : "bg-purple-200"}
              />

              <div className="space-y-2">
                <h4
                  className={`font-medium ${
                    darkMode ? "text-purple-300" : "text-purple-900"
                  }`}
                >
                  Details
                </h4>
                <div className="text-xs space-y-2">
                  <TooltipProvider>
                    <div className="flex justify-left items-center">
                      <span
                        className={`font-medium mr-2 ${
                          darkMode ? "text-purple-400" : "text-purple-800"
                        }`}
                      >
                        Mint:
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-6 w-6 mr-1 ${
                          darkMode
                            ? "text-purple-400 hover:text-purple-300 hover:bg-gray-700"
                            : "text-purple-700 hover:text-purple-900 hover:bg-purple-100"
                        }`}
                        onClick={() =>
                          copyToClipboard(nftDetail.mintAddress, "mint")
                        }
                        title="Copy to clipboard"
                      >
                        {copied === "mint" ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span
                            className={`max-w-[200px] inline-block ${
                              darkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            {nftDetail.mintAddress}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent
                          className={
                            darkMode
                              ? "bg-gray-700 text-white"
                              : "bg-purple-700 text-white"
                          }
                        >
                          <p className="break-all max-w-[300px]">
                            {nftDetail.mintAddress}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>

                    <div className="flex justify-left items-center">
                      <span
                        className={`font-medium mr-2 ${
                          darkMode ? "text-purple-400" : "text-purple-800"
                        }`}
                      >
                        Owner:
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-6 w-6 mr-1 ${
                          darkMode
                            ? "text-purple-400 hover:text-purple-300 hover:bg-gray-700"
                            : "text-purple-700 hover:text-purple-900 hover:bg-purple-100"
                        }`}
                        onClick={() =>
                          copyToClipboard(nftDetail.owner, "owner")
                        }
                        title="Copy to clipboard"
                      >
                        {copied === "owner" ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span
                            className={`max-w-[200px] inline-block ${
                              darkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            {nftDetail.owner}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent
                          className={
                            darkMode
                              ? "bg-gray-700 text-white"
                              : "bg-purple-700 text-white"
                          }
                        >
                          <p className="break-all max-w-[300px]">
                            {nftDetail.owner}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>

                    <div className="flex justify-left items-center">
                      <span
                        className={`font-medium mr-2 ${
                          darkMode ? "text-purple-400" : "text-purple-800"
                        }`}
                      >
                        Update Authority:
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-6 w-6 mr-1 ${
                          darkMode
                            ? "text-purple-400 hover:text-purple-300 hover:bg-gray-700"
                            : "text-purple-700 hover:text-purple-900 hover:bg-purple-100"
                        }`}
                        onClick={() =>
                          copyToClipboard(
                            nftDetail.updateAuthority,
                            "updateAuthority"
                          )
                        }
                        title="Copy to clipboard"
                      >
                        {copied === "updateAuthority" ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span
                            className={`max-w-[200px] inline-block ${
                              darkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            {nftDetail.updateAuthority}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent
                          className={
                            darkMode
                              ? "bg-gray-700 text-white"
                              : "bg-purple-700 text-white"
                          }
                        >
                          <p className="break-all max-w-[300px]">
                            {nftDetail.updateAuthority}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TooltipProvider>

                  <div className="flex justify-left">
                    <span
                      className={`font-medium ${
                        darkMode ? "text-purple-400" : "text-purple-800"
                      }`}
                    >
                      Seller Fee:
                    </span>
                    <span
                      className={`px-2 ${
                        darkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      {nftDetail.sellerFeeBasisPoints / 100}%
                    </span>
                  </div>
                </div>
              </div>

              {nftDetail.externalUrl && (
                <Button
                  variant="outline"
                  asChild
                  className={`w-full mt-4 ${
                    darkMode
                      ? "border-purple-600 text-purple-400 hover:bg-gray-700 hover:text-purple-300"
                      : "border-purple-500 text-purple-700 hover:bg-purple-100 hover:text-purple-900"
                  }`}
                >
                  <a
                    href={
                      nftDetail.properties?.files?.[0]?.uri ||
                      nftDetail.properties?.files?.[0]?.url
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2"
                  >
                    High Res Image
                    <ChevronRight className="h-4 w-4" />
                  </a>
                </Button>
              )}
              
              <button
                onClick={() =>
                  window.open(`/nft/${nftDetail.mintAddress}`, "_blank")
                }
                className={`w-full rounded-xl px-4 py-2 font-semibold transition-colors duration-200 ${
                  darkMode
                    ? "bg-purple-600 text-white hover:bg-purple-500"
                    : "bg-purple-700 text-white hover:bg-purple-800"
                }`}
              >
                Buy NFT
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
