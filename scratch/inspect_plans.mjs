import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qahjupobulzntdlnpadh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhaGp1cG9idWx6bnRkbG5wYWRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5OTc2MzksImV4cCI6MjEwMjU3MzYzOX0.gtgQi2VTq47e1SSH8EtaG8QUVGV574WAQKDtfClJ-C8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.from('study_plans').select('*');
  console.log('Query result:', { count: data?.length, error });
  if (data && data.length > 0) {
    for (const plan of data) {
      console.log('=== Plan ID:', plan.id, 'Title:', plan.title, 'Subject ID:', plan.subject_id, 'Length:', plan.html_content?.length);
      const lines = (plan.html_content || '').split('\n');
      console.log('Total lines:', lines.length);
      console.log('Lines 430 to 500:');
      for (let i = Math.max(0, 430); i < Math.min(lines.length, 500); i++) {
        console.log(`${i + 1}: ${lines[i]}`);
      }
    }
  }
}

main();
