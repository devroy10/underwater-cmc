export type Feature = {
  readonly title: string;
  readonly description: string;
  readonly image: string;
  /** Grid span on desktop: 1 (narrow) or 2 (wide). */
  readonly span: 1 | 2;
};

export type Stat = {
  readonly value: string;
  readonly label: string;
};

export type Finding = {
  readonly title: string;
  readonly image: string;
  readonly alt: string;
};

export type DeveloperItem = {
  readonly title: string;
  readonly description: string;
  readonly image: string;
};
