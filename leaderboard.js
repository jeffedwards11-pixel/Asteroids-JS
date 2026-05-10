const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function saveScore(username, score) {
  const { error } = await supabaseClient
    .from('scores')
    .insert({ username, score });

  if (error) throw new Error(error.message);
}

async function fetchWeeklyTop3() {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabaseClient
    .from('scores')
    .select('username, score')
    .gt('created_at', since)
    .order('score', { ascending: false })
    .limit(3);

  if (error) throw new Error(error.message);
  return data;
}

async function fetchAllTimeTop10() {
  const { data, error } = await supabaseClient
    .from('scores')
    .select('username, score')
    .order('score', { ascending: false })
    .limit(10);

  if (error) throw new Error(error.message);
  return data;
}
