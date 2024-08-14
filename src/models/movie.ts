import mongoose, { Document, Schema } from 'mongoose';

interface IVideo {
  cyberlocker: string;
  quality: string;
  result: string;
  embedded_url: string;
  language: string;
  url: string;
}

interface IGenre {
  id: string;
  name: string;
  slug: string;
}

interface IMovieAdditionalData {
  blog: boolean;
  blogPeliculas: boolean;
  thisMovie: {
    TMDbId: string;
    downloads: IVideo[];
    genres: IGenre[];
    images: {
      backdrop: string;
      poster: string;
    };
    overview: string;
    rate: {
      average: number;
      votes: number;
    };
    releaseDate: Date;
    runtime: number;
    titles: {
      name: string;
      original: {
        name: string;
      };
    };
    url: {
      slug: string;
    };
    videos: {
      english: IVideo[];
      japanese: IVideo[];
      latino: IVideo[];
      spanish: IVideo[];
    };
  };
}

export interface IMovie extends Document {
  tmdb_id: string;
  titles: string;
  additional_data: IMovieAdditionalData;
  video_urls: IVideo[];
}

const VideoSchema = new Schema<IVideo>({
  cyberlocker: String,
  quality: String,
  result: String,
  embedded_url: String,
  language: String,
  url: String
});

const GenreSchema = new Schema<IGenre>({
  id: String,
  name: String,
  slug: String
});

const MovieSchema = new Schema<IMovie>({
  tmdb_id: {type : String, index : true},
  titles: { type: String, index: true },
  additional_data: {
    blog: Boolean,
    blogPeliculas: Boolean,
    thisMovie: {
      TMDbId: { type: String, index: true },
      downloads: [VideoSchema],
      genres: [GenreSchema],
      images: {
        backdrop: String,
        poster: String
      },
      overview: String,
      rate: {
        average: Number,
        votes: Number
      },
      releaseDate: Date,
      runtime: Number,
      titles: {
        name: String,
        original: {
          name: String
        }
      },
      url: {
        slug: { type: String, index: true }
      },
      videos: {
        english: [VideoSchema],
        japanese: [VideoSchema],
        latino: [VideoSchema],
        spanish: [VideoSchema]
      }
    }
  },
  video_urls: [VideoSchema]
});


// Índice compuesto para búsquedas frecuentes
MovieSchema.index({ 'additional_data.thisMovie.url.slug': 1, tmdb_id: 1 });


export const Movie = mongoose.model<IMovie>('Movie', MovieSchema);