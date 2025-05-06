export interface Collection {
    symbol: string;
    name: string;
    description: string;
    image: string ;
    floorPrice: number; 
    volumeAll: number;
    hasCNFTs: boolean;
  }


  export interface Listing {
    pdaAddress: string;
    auctionHouse: string;
    tokenAddress: string;
    tokenMint: string;
    seller: string;
    sellerReferral: string;
    tokenSize: number;
    price: number;
    priceInfo?: {
      solPrice?: {
        rawAmount: string;
        address: string;
        decimals: number;
      };
    };
    rarity?: {
      moonrank?: {
        rank: number;
        absolute_rarity?: number;
        crawl?: object;
      };
    };
    extra?: {
      img?: string;
    };
    expiry: number;
    token: {
      mintAddress: string;
      owner: string;
      supply: number;
      collection: string;
      collectionName: string;
      name: string;
      updateAuthority: string;
      primarySaleHappened: boolean;
      sellerFeeBasisPoints: number;
      image: string;
      externalUrl: string | null;
      attributes: Array<{
        trait_type: string;
        value: string | number;
      }>;
      properties: {
        files: Array<{
          uri: string;
          type: string;
        }>;
        category: string;
        creators: Array<{
          share: number;
          address: string;
        }>;
      };
      listStatus: string;
      tokenAddress: string;
    };
    listingSource?: string;
  }


  export interface NftAttribute {
    trait_type: string;
    value: string | number;
  }
  
  export interface NftCreator {
      address: string;
      share: number;
  }
  
  export interface NftFile {
      uri: string;
      type: string;
      url:string;
  }
  
export interface NftProperties {
  files: NftFile[];
  category: string;
  creators: NftCreator[];
}

export interface FilterState {
  minPrice: string
  maxPrice: string
  sortBy: "listPrice" | "updatedAt"
  sortDir: "asc" | "desc"
  offset: number
  limit: number
}

export interface NftDetail {
    mintAddress: string;
    owner: string;
    supply: number;
    collection: string; 
    collectionName?: string; 
    name: string;
    updateAuthority: string;
    primarySaleHappened: boolean;
    sellerFeeBasisPoints: number;
    image: string;
    externalUrl: string | null;
    attributes: NftAttribute[];
    properties: NftProperties;
    description?: string; 
    animation_url?: string | null;
}
  