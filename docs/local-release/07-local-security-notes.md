# Local Security Notes

Default binding is loopback-only. LAN binding is explicit, unauthenticated, and restricted to trusted private networks. The project configures no firewall, domain, public listener, or cloud service.

CSV uploads stay in memory, are limited to 5 MB, validated by `RULService`, and are not logged or persisted. Model/joblib upload is unsupported. Trusted local artifacts use separate demo/real directories, fixed expected files, checksums, schema/version checks, and mode validation.

Generated logs rotate at 512 KB with two backups and contain operational events—not trajectory data. `runtime/logs`, `runtime/temporary`, `runtime/uploads`, raw data, local environments, and generated artifacts are Git-ignored.
