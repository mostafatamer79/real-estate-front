/** Apply control-panel changes without replacing newer translation-editor edits. */
export function mergeSettingsTextEdits(baseline: Record<string,string>, editor: Record<string,string>, controls: Record<string,string>): Record<string,string> {
  const merged={...editor};
  for(const [key,value] of Object.entries(controls)){
    if(value!==baseline[key])merged[key]=value;
  }
  return merged;
}
