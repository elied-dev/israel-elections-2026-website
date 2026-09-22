import { asc, eq, sql } from 'drizzle-orm';
import { getDb } from '@/db/client';
import { tags } from '@/db/schema';

export type PublicRecordFilters = {
  q?: string;
  actorType?: string;
  tag?: string;
  dateFrom?: string;
  dateTo?: string;
  language?: string;
};

type SearchResult = {
  kind: 'actor' | 'claim' | 'tag' | 'source';
  id: number;
  title: string;
  href: string | null;
  actorType: string | null;
  language: string | null;
  resultDate: Date | string | null;
  tagNames: string | null;
  score: number;
};

const actorTypes = new Set(['person', 'political_party', 'electoral_list']);

function validDate(value?: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? '')) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : null;
}

export async function searchPublicRecord(input: PublicRecordFilters = {}) {
  const db = getDb();
  const q = (input.q ?? '').trim().slice(0, 200);
  const actorType = actorTypes.has(input.actorType ?? '') ? input.actorType! : null;
  const tagId = /^\d+$/.test(input.tag ?? '') && Number(input.tag) <= 2147483647 ? Number(input.tag) : null;
  const dateFrom = validDate(input.dateFrom);
  const dateTo = validDate(input.dateTo);
  const language = /^[a-z]{2,3}(?:-[a-z0-9]+)*$/i.test(input.language ?? '') ? input.language!.toLowerCase() : null;

  const result = await db.execute<SearchResult>(sql`
    with public_actors as (
      select pa.id, pa.type, pa.current_display_name, pa.current_slug
      from political_actors pa
      where
        (pa.type = 'person' and exists (
          select 1
          from candidacies c
          join candidacy_revisions cr on cr.candidacy_id = c.id and cr.electoral_list_id = c.electoral_list_id
          join electoral_lists el on el.id = c.electoral_list_id
          where c.person_id = pa.id and cr.review_state = 'approved' and el.review_state = 'approved'
        ))
        or (pa.type = 'electoral_list' and exists (
          select 1 from electoral_lists el where el.id = pa.id and el.review_state = 'approved'
        ))
        or (pa.type = 'political_party' and exists (
          select 1
          from electoral_list_parties elp
          join electoral_lists el on el.id = elp.electoral_list_id
          where elp.political_party_id = pa.id and elp.review_state = 'approved' and el.review_state = 'approved'
        ))
    ),
    public_claims as (
      select pc.*
      from public_claims pc
      where pc.review_state = 'approved' and exists (
        select 1
        from evidence_citations ec
        join source_versions sv on sv.id = ec.source_version_id and sv.review_state = 'approved'
        join source_records sr on sr.id = sv.source_record_id and sr.review_state = 'approved'
        where ec.public_claim_id = pc.id and ec.review_state = 'approved'
      )
    ),
    records as (
      select 'actor'::text as kind, pa.id, pa.current_display_name as title,
        case when pa.type = 'person' then '/people/' || pa.id
             when pa.type = 'electoral_list' then '/electoral-lists/' || pa.current_slug
             else null end as href,
        pa.type as "actorType", null::text as language,
        null::timestamptz as "dateFrom", null::timestamptz as "dateTo", null::text as "tagNames"
      from public_actors pa
      union all
      select 'claim', pc.id, pc.summary, '/claims/' || pc.id, null, pc.language,
        pc.statement_from, coalesce(pc.statement_to, pc.statement_from),
        (select string_agg(t.name, ', ' order by t.name)
         from public_claim_tags pct join tags t on t.id = pct.tag_id
         where pct.public_claim_id = pc.id and pct.review_state = 'approved' and t.review_state = 'approved')
      from public_claims pc
      union all
      select 'tag', t.id, t.name, '/public-record?tag=' || t.id, null, t.language,
        null, null, null
      from tags t where t.review_state = 'approved'
      union all
      select 'source', sr.id, sr.title, '/sources/' || sr.id, null, sr.source_language,
        sr.publication_date, sr.publication_date,
        (select string_agg(t.name, ', ' order by t.name)
         from source_record_tags srt join tags t on t.id = srt.tag_id
         where srt.source_record_id = sr.id and srt.review_state = 'approved' and t.review_state = 'approved')
      from source_records sr where sr.review_state = 'approved'
    ),
    documents as (
      select 'actor'::text as kind, pa.id, pa.current_display_name as text, 'und'::text as language from public_actors pa
      union all
      select 'actor', pn.person_id, pn.name, 'und' from person_names pn join public_actors pa on pa.id = pn.person_id where pn.review_state = 'approved'
      union all
      select 'actor', pats.political_actor_id, pats.term, pats.language from political_actor_search_terms pats join public_actors pa on pa.id = pats.political_actor_id where pats.review_state = 'approved'
      union all
      select 'claim', pc.id, pc.summary, pc.language from public_claims pc
      union all
      select 'claim', pc.id, t.name, t.language
      from public_claims pc join public_claim_tags pct on pct.public_claim_id = pc.id and pct.review_state = 'approved'
      join tags t on t.id = pct.tag_id and t.review_state = 'approved'
      union all
      select 'claim', pc.id, pa.current_display_name, 'und'
      from public_claims pc
      join (select public_claim_id, political_actor_id from public_claim_speakers union select public_claim_id, political_actor_id from public_claim_subjects) ca on ca.public_claim_id = pc.id
      join public_actors pa on pa.id = ca.political_actor_id
      union all
      select 'claim', pc.id, pn.name, 'und'
      from public_claims pc
      join (select public_claim_id, political_actor_id from public_claim_speakers union select public_claim_id, political_actor_id from public_claim_subjects) ca on ca.public_claim_id = pc.id
      join person_names pn on pn.person_id = ca.political_actor_id and pn.review_state = 'approved'
      union all
      select 'claim', pc.id, pats.term, pats.language
      from public_claims pc
      join (select public_claim_id, political_actor_id from public_claim_speakers union select public_claim_id, political_actor_id from public_claim_subjects) ca on ca.public_claim_id = pc.id
      join political_actor_search_terms pats on pats.political_actor_id = ca.political_actor_id and pats.review_state = 'approved'
      union all
      select 'claim', pc.id, sr.title || ' ' || sr.source_type || ' ' || coalesce(sr.author, '') || ' ' || coalesce(sr.publisher, ''), sr.source_language
      from public_claims pc
      join evidence_citations ec on ec.public_claim_id = pc.id and ec.review_state = 'approved'
      join source_versions sv on sv.id = ec.source_version_id and sv.review_state = 'approved'
      join source_records sr on sr.id = sv.source_record_id and sr.review_state = 'approved'
      union all
      select 'claim', pc.id, q.text, q.source_language
      from public_claims pc
      join evidence_citations ec on ec.public_claim_id = pc.id and ec.review_state = 'approved'
      join quotations q on q.evidence_citation_id = ec.id and q.review_state = 'approved'
      union all
      select 'claim', pc.id, qt.text, qt.language
      from public_claims pc
      join evidence_citations ec on ec.public_claim_id = pc.id and ec.review_state = 'approved'
      join quotations q on q.evidence_citation_id = ec.id and q.review_state = 'approved'
      join quotation_translations qt on qt.quotation_id = q.id and qt.review_state = 'approved'
      union all
      select 'source', sr.id, sr.title || ' ' || sr.source_type || ' ' || coalesce(sr.author, '') || ' ' || coalesce(sr.publisher, ''), sr.source_language
      from source_records sr where sr.review_state = 'approved'
      union all
      select 'source', sr.id, t.name, t.language
      from source_records sr join source_record_tags srt on srt.source_record_id = sr.id and srt.review_state = 'approved'
      join tags t on t.id = srt.tag_id and t.review_state = 'approved'
      where sr.review_state = 'approved'
      union all
      select 'tag', t.id, t.name, t.language from tags t where t.review_state = 'approved'
    ),
    filtered as (
      select r.*
      from records r
      where (${actorType}::text is null or
        (r.kind = 'actor' and r."actorType" = ${actorType}) or
        (r.kind = 'claim' and exists (
          select 1 from (
            select public_claim_id, political_actor_id from public_claim_speakers
            union select public_claim_id, political_actor_id from public_claim_subjects
          ) ca join public_actors pa on pa.id = ca.political_actor_id
          where ca.public_claim_id = r.id and pa.type = ${actorType}
        )) or
        (r.kind = 'source' and exists (
          select 1 from source_versions sv
          join evidence_citations ec on ec.source_version_id = sv.id and ec.review_state = 'approved'
          join public_claims pc on pc.id = ec.public_claim_id
          join (select public_claim_id, political_actor_id from public_claim_speakers union select public_claim_id, political_actor_id from public_claim_subjects) ca on ca.public_claim_id = pc.id
          join public_actors pa on pa.id = ca.political_actor_id
          where sv.source_record_id = r.id and sv.review_state = 'approved' and pa.type = ${actorType}
        )))
        and (${tagId}::integer is null or
          (r.kind = 'claim' and exists (select 1 from public_claim_tags pct join tags t on t.id = pct.tag_id and t.review_state = 'approved' where pct.public_claim_id = r.id and pct.tag_id = ${tagId} and pct.review_state = 'approved')) or
          (r.kind = 'source' and exists (select 1 from source_record_tags srt join tags t on t.id = srt.tag_id and t.review_state = 'approved' where srt.source_record_id = r.id and srt.tag_id = ${tagId} and srt.review_state = 'approved')))
        and (${dateFrom}::date is null or r."dateTo"::date >= ${dateFrom}::date)
        and (${dateTo}::date is null or r."dateFrom"::date <= ${dateTo}::date)
        and (${language}::text is null or
          (r.kind = 'actor' and exists (select 1 from political_actor_search_terms pats where pats.political_actor_id = r.id and pats.language = ${language} and pats.review_state = 'approved')) or
          (r.kind <> 'actor' and r.language = ${language}))
    ),
    scored as (
      select r.kind, r.id, r.title, r.href, r."actorType", r.language,
        r."dateFrom" as "resultDate", r."tagNames",
        max(
          case when lower(d.text) = lower(${q}) then 4
               when lower(d.text) like lower(${q}) || '%' then 3
               else 0 end
          + greatest(
            similarity(lower(d.text), lower(${q})),
            ts_rank_cd(
              to_tsvector(case when d.language = 'en' then 'english'::regconfig when d.language = 'fr' then 'french'::regconfig else 'simple'::regconfig end, d.text),
              websearch_to_tsquery(case when d.language = 'en' then 'english'::regconfig when d.language = 'fr' then 'french'::regconfig else 'simple'::regconfig end, ${q})
            )
          )
        ) as score
      from filtered r join documents d on d.kind = r.kind and d.id = r.id
      where ${q} = '' or lower(d.text) like '%' || lower(${q}) || '%'
        or similarity(lower(d.text), lower(${q})) >= 0.3
        or to_tsvector(case when d.language = 'en' then 'english'::regconfig when d.language = 'fr' then 'french'::regconfig else 'simple'::regconfig end, d.text)
          @@ websearch_to_tsquery(case when d.language = 'en' then 'english'::regconfig when d.language = 'fr' then 'french'::regconfig else 'simple'::regconfig end, ${q})
      group by r.kind, r.id, r.title, r.href, r."actorType", r.language, r."dateFrom", r."tagNames"
    )
    select kind, id, title, href, "actorType", language, "resultDate", "tagNames", score
    from scored
    order by case when ${q} = '' then 0 else score end desc,
      case kind when 'actor' then 1 when 'claim' then 2 when 'tag' then 3 else 4 end,
      lower(title), id
  `);

  const tagOptions = await db
    .select({ id: tags.id, name: tags.name, language: tags.language })
    .from(tags)
    .where(eq(tags.reviewState, 'approved'))
    .orderBy(asc(tags.name), asc(tags.id));
  const languageRows = await db.execute<{ language: string }>(sql`
    select distinct language from (
      select language from political_actor_search_terms where review_state = 'approved'
      union select language from public_claims where review_state = 'approved'
      union select source_language as language from source_records where review_state = 'approved'
      union select language from tags where review_state = 'approved'
    ) languages where language <> 'und' order by language
  `);

  return {
    filters: { q, actorType: actorType ?? '', tag: tagId?.toString() ?? '', dateFrom: dateFrom ?? '', dateTo: dateTo ?? '', language: language ?? '' },
    tags: tagOptions,
    languages: languageRows.rows.map(({ language: value }) => value),
    results: result.rows.map((row) => ({
      ...row,
      resultDate: row.resultDate ? new Date(row.resultDate) : null,
    })),
  };
}
