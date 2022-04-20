export interface Renderer {
  setup(): Promise<boolean>;
  render(files: Array<Array<string>>): Promise<boolean>;
  cleanup(): Promise<boolean>;
}
